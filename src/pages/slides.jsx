import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DefaultContainer from "../components/defaultContainter";
import { Document, Page, pdfjs } from "react-pdf";
import Spinner from "../components/spinner";
import { ContextMenuComponent } from "@syncfusion/ej2-react-navigations";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-icons/styles/material.css";
import "@syncfusion/ej2-react-navigations/styles/material.css";
import { useTheme } from "../components/themeProvider";

// Configura il worker di PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function Slides() {
  const location = useLocation();
  const navigate = useNavigate();
  const exam = location.state?.exam;
  const [showHidden, setShowHidden] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [previews, setPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(new Set());
  const [renderedCount, setRenderedCount] = useState(0);
  const [showSpinner, setShowSpinner] = useState(false);
  const [contextMenuPdf, setContextMenuPdf] = useState(null);
  const contextMenuRefs = useRef({});
  const [renameModal, setRenameModal] = useState({ open: false, oldName: "" });
  const [renameValue, setRenameValue] = useState("");
  const { dark } = useTheme();

  // Nuovi stati per exam.json e modal aggiunta PDF
  const [examJson, setExamJson] = useState([]);
  const [addModal, setAddModal] = useState({ open: false, filePath: null });
  const [addPin, setAddPin] = useState(false);
  const [addTag, setAddTag] = useState("slides");
    const [tagFilter, setTagFilter] = useState("all");

  const [addFileName, setAddFileName] = useState("");
  const [addPreviewUrl, setAddPreviewUrl] = useState("");
  const [bulkModal, setBulkModal] = useState({ open: false, files: [] });
  const [deleteModal, setDeleteModal] = useState({ open: false, file: null });

  const buttonLight = "bg-[#6331c9] text-white hover:bg-[#7a4ed1]";
  const buttonDark =
    "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] border border-[#D2D6EF]";

  const pdfMenuItems = [
    {
      text: (file) => {
        const meta = examJson.find((obj) => obj.file === file);
        return meta?.pinned ? "Unpin" : "Pin";
      },
      iconCss: "e-icons e-star",
      id: "pin-toggle",
    },
    {
      text: "Change tag",
      iconCss: "e-icons e-folder",
      id: "change-tag",
      items: [
        { text: "Slides", id: "tag-slides" },
        { text: "Book", id: "tag-book" },
      ],
    },
    {
      text: (file) => {
        const meta = examJson.find((obj) => obj.file === file);
        return meta?.hidden ? "Unmark as done" : "Mark as done";
      },
      iconCss: "e-icons e-check",
      id: "toggle-hidden",
    },
    { separator: true },
    { text: "Rename", iconCss: "e-icons e-edit", id: "rename" },
    { text: "Delete", iconCss: "e-icons e-trash", id: "delete" },
  ];

  useEffect(() => {
    setRenderedCount(0);
  }, [pdfFiles]);

  useEffect(() => {
    if (!exam) return;
    window.electron.invoke("list-pdf-files", exam).then((files) => {
      setPdfFiles(files || []);
      setRenderedCount(0);
    });
  }, [exam]);

  useEffect(() => {
    if (pdfFiles.length > 0) setShowSpinner(true);
  }, [pdfFiles.length]);

  useEffect(() => {
    if (pdfFiles.length > 0 && renderedCount >= pdfFiles.length) {
      const timeout = setTimeout(() => setShowSpinner(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [renderedCount, pdfFiles.length]);

  useEffect(() => {
    if (!pdfFiles.length) return;
    setPreviews({});
    setLoadingPreviews(new Set(pdfFiles));
    pdfFiles.forEach(async (file) => {
      try {
        const base64 = await window.electron.invoke(
          "get-pdf-base64",
          exam,
          file
        );
        if (base64) {
          const pdfUrl = `data:application/pdf;base64,${base64}`;
          setPreviews((prev) => ({
            ...prev,
            [file]: { url: pdfUrl, base64 },
          }));
        }
      } catch (error) {
        // eslint-disable-next-line
      } finally {
        setLoadingPreviews((prev) => {
          const newSet = new Set(prev);
          newSet.delete(file);
          return newSet;
        });
        setRenderedCount((prev) => prev + 1); // <-- aggiungi qui!
      }
    });
  }, [pdfFiles, exam]);

  useEffect(() => {
    if (!exam) return;
    refreshPdfFiles();
    // eslint-disable-next-line
  }, [exam]);

  const handlePdfMenuClick = async (args, file) => {
    const metaIdx = examJson.findIndex((obj) => obj.file === file);
    if (args.item.id === "pin-toggle") {
      if (metaIdx !== -1) {
        const updated = [...examJson];
        updated[metaIdx].pinned = !updated[metaIdx].pinned;
        await window.electron.invoke("set-exam-json", exam, updated);
        setExamJson(updated);
      }
      return;
    }
    if (args.item.id === "tag-slides" || args.item.id === "tag-book") {
      if (metaIdx !== -1) {
        const updated = [...examJson];
        updated[metaIdx].tag =
          args.item.id === "tag-slides" ? "slides" : "book";
        await window.electron.invoke("set-exam-json", exam, updated);
        setExamJson(updated);
      }
      return;
    }
    if (args.item.id === "toggle-hidden") {
      if (metaIdx !== -1) {
        const updated = [...examJson];
        updated[metaIdx].hidden = !updated[metaIdx].hidden;
        await window.electron.invoke("set-exam-json", exam, updated);
        setExamJson(updated);
      }
      return;
    }
    if (args.item.id === "rename") {
      setRenameModal({ open: true, oldName: file });
      setRenameValue(file.replace(/\.pdf$/i, ""));
      return;
    }
    if (args.item.id === "delete") {
      setDeleteModal({ open: true, file });
    }
  };

  const confirmDeletePdf = async () => {
    const file = deleteModal.file;
    if (!file) return;
    const success = await window.electron.invoke("delete-pdf-file", exam, file);
    if (success) {
      const updated = examJson.filter((obj) => obj.file !== file);
      await window.electron.invoke("set-exam-json", exam, updated);
      setExamJson(updated);
      await refreshPdfFiles();
    } else {
      alert("Delete failed.");
    }
    setDeleteModal({ open: false, file: null });
  };

  function trimPreviewFileName(file) {
    let name = file.replace(/\.pdf$/i, "");
    if (name.length > 14) {
      name = name.slice(0, 14) + "...";
    }
    return name;
  }

  function getPdfMenuItems(file) {
    return pdfMenuItems.map((item) =>
      typeof item.text === "function"
        ? { ...item, text: item.text(file) }
        : { ...item }
    );
  }

  const confirmRename = async () => {
    const newName = renameValue.trim();
    if (!newName || newName === renameModal.oldName.replace(/\.pdf$/i, ""))
      return;
    const newFileName = newName.endsWith(".pdf") ? newName : newName + ".pdf";
    const success = await window.electron.invoke(
      "rename-pdf-file",
      exam,
      renameModal.oldName,
      newFileName
    );
    if (success) {
      // Update examJson: change file name in the corresponding object
      const updated = examJson.map((obj) =>
        obj.file === renameModal.oldName ? { ...obj, file: newFileName } : obj
      );
      await window.electron.invoke("set-exam-json", exam, updated);
      setExamJson(updated);
      await refreshPdfFiles();
      setRenameModal({ open: false, oldName: "" });
      setRenameValue("");
    } else {
      alert("Rename failed.");
    }
  };

  const handlePdfContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenuPdf(file);
    if (contextMenuRefs.current[file]) {
      contextMenuRefs.current[file].open(e.pageY, e.pageX);
    }
  };

  function trimFileName(file) {
    let name = file.replace(/\.pdf$/i, "");
    if (name.length > 15) {
      name = name.slice(0, 15) + "...";
    }
    return name;
  }

  const refreshPdfFiles = async () => {
    const files = await window.electron.invoke("list-pdf-files", exam);
    setPdfFiles(files || []);
    setRenderedCount(0);
    setShowSpinner(true);
    // Aggiorna anche examJson
    const data = await window.electron.invoke("get-exam-json", exam);
    setExamJson(Array.isArray(data) ? data : []);
  };

  // --- Nuova logica per aggiunta PDF con modal ---
  const handleAddPdf = async () => {
    const filePaths = await window.electron.invoke("open-pdf-dialog-multi");
    if (!filePaths || filePaths.length === 0) return;
    if (filePaths.length === 1) {
      // Comportamento singolo file (come prima)
      const filePath = filePaths[0];
      const fileName = filePath.split(/[\\/]/).pop();
      setAddFileName(fileName);
      setAddPin(false);
      setAddTag("slides");
      const base64 = await window.electron.invoke(
        "get-pdf-base64-from-path",
        filePath
      );
      if (base64) setAddPreviewUrl(`data:application/pdf;base64,${base64}`);
      setAddModal({ open: true, filePath });
    } else {
      // Bulk upload
      setBulkModal({ open: true, files: filePaths });
    }
  };

  const confirmBulkAddPdf = async () => {
    const pdfObjs = [];
    for (const filePath of bulkModal.files) {
      const fileName = filePath.split(/[\\/]/).pop();
      // Copia PDF nella cartella esame
      await window.electron.invoke("add-pdf-to-exam", exam, filePath);
      pdfObjs.push({
        file: fileName,
        pinned: false,
        tag: "slides",
        hidden: false,
      });
    }
    const updated = [...examJson, ...pdfObjs];
    await window.electron.invoke("set-exam-json", exam, updated);
    setExamJson(updated);
    setBulkModal({ open: false, files: [] });
    await refreshPdfFiles();
  };

  const confirmAddPdf = async () => {
    // Copia PDF nella cartella esame
    await window.electron.invoke("add-pdf-to-exam", exam, addModal.filePath);
    // Aggiorna exam.json
    const obj = {
      file: addFileName,
      pinned: addPin,
      tag: addTag,
      hidden: false,
    };
    const updated = [...examJson, obj];
    await window.electron.invoke("set-exam-json", exam, updated);
    setExamJson(updated);
    setAddModal({ open: false, filePath: null });
    setAddPreviewUrl("");
    await refreshPdfFiles();
  };

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="text-2xl text-[#6331c9]">Exam not found</h2>
      </div>
    );
  }

  return (
    <DefaultContainer className="overflow-hidden">
      <div className="overflow-hidden flex flex-col items-center">
        <div className="absolute top-20 w-screen flex justify-between items-center px-8">
          <div className="w-40 flex justify-start">
            <button
              className={`cursor-pointer flex items-center justify-center gap-2 w-32 h-10 rounded-3xl hover:w-40 transition-all duration-200 ${
                dark
                  ? "bg-[#D2D6EF] font-semibold text-[#181825] hover:bg-[#b8bce0]"
                  : "bg-[#6331c9] text-white hover:bg-[#7a4ed1]"
              }`}
              onClick={() => navigate(-1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Go Back
            </button>
          </div>
          <h1
            className={`text-4xl font-bold text-center ${
              dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
            }`}
          >
            {exam}
          </h1>
          {/* View Hidden Button */}
          <div className="w-40 flex justify-end gap-4">
             <div className="flex items-center gap-2">
              <select
                className={`rounded-xl px-2 py-3 border text-sm ${
                  dark
                    ? "bg-[#232336] text-[#D2D6EF] border-[#D2D6EF]"
                    : "bg-white text-[#6331c9] border-[#6331c9]"
                }`}
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                title="Filter by tag"
              >
                <option value="all">All tags</option>
                <option value="slides">Slides</option>
                <option value="book">Book</option>
              </select>
            </div>
            <button
              className={`flex items-center justify-center cursor-pointer px-3 py-3 hover:px-8 rounded-full transition-all ${
                dark
                  ? "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0]"
                  : "bg-[#6331c9] text-white hover:bg-[#7a4ed1]"
              }`}
              onClick={() => setShowHidden((prev) => !prev)}
              aria-label={showHidden ? "Hide hidden PDFs" : "View hidden PDFs"}
              title={showHidden ? "Hide hidden PDFs" : "View hidden PDFs"}
              type="button"
            >
              {showHidden ? (
                // Eye open SVG
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                // Eye closed SVG
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 002.25 12s3.75 7.5 9.75 7.5c2.042 0 3.93-.488 5.57-1.277M21.75 12c-.621-1.293-1.507-2.727-2.73-4.027M9.53 9.53a3 3 0 014.24 4.24m-4.24-4.24L3 3m6.53 6.53L21 21"
                  />
                </svg>
              )}
            </button>
            <button
              className={`flex items-center justify-center cursor-pointer px-3 py-3 hover:px-8  rounded-full transition-all ${
                dark
                  ? "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0]"
                  : "bg-[#6331c9] text-white hover:bg-[#7a4ed1]"
              }`}
              onClick={handleAddPdf}
              aria-label="Upload PDF"
              title="Upload PDF"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            
          </div>
        </div>
        {pdfFiles.length > 0 && renderedCount < pdfFiles.length && (
          <div
            className={` flex justify-center items-center w-full h-[100vh] z-50 absolute top-0 left-0 ${
              dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
            }`}
          >
            <Spinner />
          </div>
        )}
        <div className="mt-40 flex flex-wrap p-10 gap-8 justify-center overflow-y-auto custom-scrollbar pb-18 z-10">
          {pdfFiles.length === 0 ? (
            <span
              className={`text-lg font-semibold ${
                dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
              }`}
            >
              No PDF files found in this exam.
            </span>
          ) : (
            [...pdfFiles]
               .filter((file) => {
                const meta = examJson.find((obj) => obj.file === file);
                // Tag filter
                if (tagFilter !== "all" && meta?.tag !== tagFilter) return false;
                // ShowHidden logic
                if (showHidden) return true;
                return !meta?.hidden;
              })
              .sort((a, b) => {
                const metaA = examJson.find((obj) => obj.file === a);
                const metaB = examJson.find((obj) => obj.file === b);
                if (metaA?.pinned && !metaB?.pinned) return -1;
                if (!metaA?.pinned && metaB?.pinned) return 1;
                return a.localeCompare(b, undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
              })
              .map((file) => {
                const meta = examJson.find((obj) => obj.file === file);
                return (
                  <div
                    key={file}
                    className="flex flex-col items-center cursor-pointer rounded-lg p-4 transition"
                    onContextMenu={(e) => handlePdfContextMenu(e, file)}
                    onClick={() =>
                      navigate("/pdfViewer", { state: { exam, file } })
                    }
                  >
                    <div className="overflow-hidden w-auto h-64 flex items-center justify-center mb-2">
                      {loadingPreviews.has(file) ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : previews[file]?.url ? (
                        <Document
                          file={previews[file].url}
                          loading={
                            <span className="text-gray-400">
                              Loading PDF...
                            </span>
                          }
                        >
                          <Page
                            pageNumber={1}
                            width={180}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={
                              <span className="text-gray-400">
                                Loading page...
                              </span>
                            }
                          />
                        </Document>
                      ) : (
                        <span className="text-red-400">Failed to load</span>
                      )}
                    </div>
                    <span
                      className={`mt-2 font-semibold text-center break-all flex items-center justify-center ${
                        dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
                      }`}
                    >
                      {trimFileName(file)}
                      {meta?.pinned && (
                        <svg
                          className="ml-2 w-4 h-4 text-red-500 inline"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" />
                        </svg>
                      )}
                    </span>
                    <ContextMenuComponent
                      ref={(el) => (contextMenuRefs.current[file] = el)}
                      items={getPdfMenuItems(file)}
                      select={(args) => handlePdfMenuClick(args, file)}
                      target=""
                    />
                  </div>
                );
              })
          )}
        </div>
      </div>
      {/* Modal per aggiunta PDF */}
      {addModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div
            className={`p-10 rounded-xl shadow-lg flex flex-col items-center ${
              dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
            }`}
          >
            <h2
              className={`mb-4 text-lg font-bold ${
                dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
              }`}
            >
              Add PDF
            </h2>
            <div className="mb-4">
              {addPreviewUrl ? (
                <Document file={addPreviewUrl}>
                  <Page
                    pageNumber={1}
                    width={180}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              ) : (
                <span>Loading preview...</span>
              )}
            </div>
            <div className="mb-2 font-semibold text-[#6331c9] dark:text-[#D2D6EF]">
              {trimPreviewFileName(addFileName)}
            </div>
            <label className="flex items-center gap-2 mb-2 text-[#6331c9] dark:text-[#D2D6EF]">
              <input
                type="checkbox"
                checked={addPin}
                onChange={(e) => setAddPin(e.target.checked)}
              />
              Pin this PDF
            </label>
            <select
              className="mb-4 border rounded px-2 py-1 text-[#6331c9] dark:text-[#d2d6ef] bg-white dark:bg-[#232336] border-[#6331c9] dark:border-[#D2D6EF]"
              value={addTag}
              onChange={(e) => setAddTag(e.target.value)}
            >
              <option value="slides">Slides</option>
              <option value="book">Book</option>
            </select>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-2xl font-semibold ${
                  dark ? buttonDark : buttonLight
                }`}
                onClick={confirmAddPdf}
              >
                Add
              </button>
              <button
                className="px-4 py-2 rounded-2xl font-semibold bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                onClick={() => setAddModal({ open: false, filePath: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {renameModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div
            className={`p-6 rounded-xl shadow-lg flex flex-col items-center ${
              dark ? "bg-[#181825]" : "bg-white"
            }`}
          >
            <h2
              className={`mb-4 text-lg font-bold ${
                dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
              }`}
            >
              Rename PDF file
            </h2>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New name"
              className={`border px-3 py-2 rounded mb-4 w-64 ${
                dark ? "bg-[#232336] text-white border-[#6331c9]" : ""
              }`}
            />
            <div className="flex gap-2">
              <button
                className={`cursor-pointer px-4 py-2 rounded-2xl font-semibold ${
                  dark ? buttonDark : buttonLight
                }`}
                onClick={confirmRename}
              >
                Rename
              </button>
              <button
                className={`cursor-pointer px-4 py-2 rounded-2xl font-semibold ${
                  dark
                    ? "bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                    : "bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"`
                }}`
                }`}
                onClick={() => setRenameModal({ open: false, oldName: "" })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {bulkModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div
            className={`p-10 rounded-xl shadow-lg flex flex-col items-center ${
              dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
            }`}
          >
            <h2
              className={`mb-4 text-lg font-bold ${
                dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
              }`}
            >
              Add {bulkModal.files.length} PDFs
            </h2>
            <ul className="mb-4 max-h-40 overflow-y-auto w-64 text-sm text-[#6331c9] dark:text-[#D2D6EF] text-left">
              {bulkModal.files.map((f) => (
                <li key={f} className="truncate">
                  {f.split(/[\\/]/).pop()}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-2xl font-semibold ${
                  dark ? buttonDark : buttonLight
                }`}
                onClick={confirmBulkAddPdf}
              >
                Add All
              </button>
              <button
                className="px-4 py-2 rounded-2xl font-semibold bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                onClick={() => setBulkModal({ open: false, files: [] })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
          <div
            className={`p-8 rounded-xl shadow-lg flex flex-col items-center ${
              dark ? "bg-[#181825]" : "bg-white"
            }`}
          >
            <h2
              className={`mb-4 text-lg font-bold ${
                dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
              }`}
            >
              Delete PDF
            </h2>
            <div className="mb-4 text-center text-[#6331c9] dark:text-[#D2D6EF]">
              Are you sure you want to delete{" "}
              <b>
                {deleteModal.file
                  ? deleteModal.file.slice(0, 15) +
                    (deleteModal.file.length > 15 ? "..." : "")
                  : ""}
              </b>
              ?{" "}
            </div>
            <div className="flex gap-2">
              <button
                className={`cursor-pointer px-4 py-2 rounded-2xl font-semibold ${
                  dark ? buttonDark : buttonLight
                }`}
                onClick={confirmDeletePdf}
              >
                Delete
              </button>
              <button
                className="cursor-pointer px-4 py-2 rounded-2xl font-semibold bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                onClick={() => setDeleteModal({ open: false, file: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <style>
        {`
    .custom-scrollbar {
      scrollbar-width: thin;
      margin-right: 20px;
      scrollbar-color: ${dark ? "#D2D6EF #181825" : "#6331c9 #D2D6EF"};
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      background: ${dark ? "#181825" : "#D2D6EF"};
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: ${dark ? "#D2D6EF" : "#6331c9"};
      border-radius: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${dark ? "#b8bce0" : "#4b2496"};
    }
  `}
      </style>
    </DefaultContainer>
  );
}
