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

  const buttonLight = "bg-[#6331c9] text-white hover:bg-[#7a4ed1]";
  const buttonDark =
    "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] border border-[#D2D6EF]";

  const pdfMenuItems = [
    { text: "Rename", iconCss: "e-icons e-edit", id: "rename" },
    { text: "Delete", iconCss: "e-icons e-trash", id: "delete" },
  ];

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
      }
    });
  }, [pdfFiles, exam]);

  useEffect(() => {
    if (!exam) return;
    refreshPdfFiles();
    // eslint-disable-next-line
  }, [exam]);

  const handlePdfLoadError = (file, error) => {
    setRenderedCount((prev) => prev + 1);
  };

  const handlePdfLoadSuccess = (file) => {
    setRenderedCount((prev) => prev + 1);
  };

  const handlePdfMenuClick = async (args, file) => {
    if (args.item.id === "rename") {
      setRenameModal({ open: true, oldName: file });
      setRenameValue(file.replace(/\.pdf$/i, ""));
      return;
    }
    if (args.item.id === "delete") {
      if (window.confirm(`Delete "${file}"?`)) {
        const success = await window.electron.invoke(
          "delete-pdf-file",
          exam,
          file
        );
        if (success) {
          await refreshPdfFiles();
        } else {
          alert("Delete failed.");
        }
      }
    }
  };

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

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="text-2xl text-[#6331c9]">Exam not found</h2>
      </div>
    );
  }

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
  };

  return (
    <DefaultContainer className="overflow-hidden">
      <div className="overflow-hidden flex flex-col items-center mt-10">
        <button
          className={`cursor-pointer absolute left-10 top-16 flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors duration-200 ${
            dark
              ? "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0]"
              : "bg-[#6331c9] text-white hover:bg-[#7a4ed1]"
          }`}
          onClick={() => navigate(-1)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Go Back
        </button>
        <h1
          className={`text-4xl font-bold mb-10 text-center ${
            dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
          }`}
        >
          {exam}
        </h1>
        <div className="absolute top-15 right-10">
          <button
            className={`flex items-center justify-center cursor-pointer px-3 py-3 rounded-full transition-colors ${
              dark
                ? "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0]"
                : "bg-[#6331c9] text-white hover:bg-[#7a4ed1]"
            }`}
            onClick={async () => {
              const filePath = await window.electron.invoke("open-pdf-dialog");
              if (!filePath) return;
              await window.electron.invoke("add-pdf-to-exam", exam, filePath);
              await refreshPdfFiles();
            }}
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
        {pdfFiles.length > 0 && renderedCount < pdfFiles.length && (
          <div
            className={`flex justify-center items-center w-full h-[100vh] z-50 absolute top-0 left-0 ${
              dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
            }`}
          >
            <Spinner />
          </div>
        )}
        <div className="flex flex-wrap gap-8 justify-center overflow-y-auto pb-18 z-10">
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
              .sort((a, b) =>
                a.localeCompare(b, undefined, {
                  numeric: true,
                  sensitivity: "base",
                })
              )
              .map((file) => (
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
                        onLoadError={(error) => handlePdfLoadError(file, error)}
                        onLoadSuccess={() => handlePdfLoadSuccess(file)}
                        loading={
                          <span className="text-gray-400">Loading PDF...</span>
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
                    className={`mt-2 font-semibold text-center break-all ${
                      dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
                    }`}
                  >
                    {trimFileName(file)}
                  </span>
                  <ContextMenuComponent
                    ref={(el) => (contextMenuRefs.current[file] = el)}
                    items={pdfMenuItems}
                    select={(args) => handlePdfMenuClick(args, file)}
                    target=""
                  />
                </div>
              ))
          )}
        </div>
      </div>
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
                    : "bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                }`}
                onClick={() => setRenameModal({ open: false, oldName: "" })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultContainer>
  );
}
