import DefaultContainer from "../components/defaultContainter";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ExamFolder from "../components/examFolder";
import { useTheme } from "../components/themeProvider";

export default function Home() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [examName, setExamName] = useState("");
  const [renameModal, setRenameModal] = useState({ open: false, oldName: "" });
  const [renameValue, setRenameValue] = useState("");
  const { dark, toggleTheme } = useTheme();
  const [deleteModal, setDeleteModal] = useState({ open: false, exam: null });

  // Settings dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const [integrationActive, setIntegrationActive] = useState(null);
  const dropdownRef = useRef();

  useEffect(() => {
    window.electron.invoke("load-exams-json").then((data) => {
      if (Array.isArray(data)) setExams(data);
    });
    window.electron
      .getAppVersion?.()
      .then((version) => setAppVersion(version || "Unknown"));
    window.electron
      .invoke("get-exam-integration-data")
      .then((exists) => setIntegrationActive(!!exists));
  }, []);

  // Chiudi dropdown su click fuori
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const buttonLight = "bg-[#6331c9] text-white hover:bg-[#4b2496]";
  const buttonDark =
    "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] border border-[#D2D6EF]";

  const handleAddExam = async () => {
    if (examName.trim() === "") return;
    const updatedExams = [
      ...exams.map((e) => (typeof e === "string" ? { name: e } : e)),
      { name: examName.trim(), color: "Purple" },
    ];
    setExams(updatedExams);
    setExamName("");
    setShowModal(false);
    await window.electron.invoke("save-exams-json", updatedExams);
    await window.electron.invoke("create-exam-folder", examName.trim());
    await window.electron.invoke("create-exam-json", examName.trim());
  };

  const handleDeleteExam = async (examToDelete) => {
    const updatedExams = exams
      .map((e) => (typeof e === "string" ? { name: e } : e))
      .filter((exam) => exam.name !== examToDelete);
    setExams(updatedExams);
    await window.electron.invoke("save-exams-json", updatedExams);
    await window.electron.invoke("delete-exam-folder", examToDelete);
  };

  const confirmRename = async () => {
    const newName = renameValue.trim();
    if (!newName || newName === renameModal.oldName) return;
    await window.electron.invoke(
      "rename-exam-folder",
      renameModal.oldName,
      newName
    );
    const updatedExams = exams.map((exam) => {
      const obj = typeof exam === "string" ? { name: exam } : exam;
      if (obj.name === renameModal.oldName) {
        return { ...obj, name: newName };
      }
      return obj;
    });
    setExams(updatedExams);
    setRenameModal({ open: false, oldName: "" });
    setRenameValue("");
    await window.electron.invoke("save-exams-json", updatedExams);
  };

  const handleRenameExam = (oldExamName) => {
    setRenameModal({ open: true, oldName: oldExamName });
    setRenameValue(oldExamName);
  };

  const handleColorExam = async (examName, colorName) => {
    const data = await window.electron.invoke("load-exams-json");
    if (!Array.isArray(data)) return;
    const normalized = data.map((item) =>
      typeof item === "string" ? { name: item } : item
    );
    const updatedExams = normalized.map((item) =>
      item.name === examName ? { ...item, color: colorName } : item
    );
    await window.electron.invoke("save-exams-json", updatedExams);
    setExams(updatedExams);
  };

  const confirmDeleteExam = async () => {
    const examToDelete = deleteModal.exam;
    if (!examToDelete) return;
    const updatedExams = exams
      .map((e) => (typeof e === "string" ? { name: e } : e))
      .filter((exam) => exam.name !== examToDelete);
    setExams(updatedExams);
    setDeleteModal({ open: false, exam: null });
    await window.electron.invoke("save-exams-json", updatedExams);
    await window.electron.invoke("delete-exam-folder", examToDelete);
  };

  // Dropdown content
  const dropdownStyle = {
    position: "absolute",
    top: "100%", // Cambiato da "60px" a "100%" per posizionare relativo al pulsante
    right: "0",
    minWidth: "220px",
    background: dark ? "#181825" : "#fff",
    color: dark ? "#D2D6EF" : "#6331c9",
    borderRadius: "1rem",
    boxShadow: showDropdown ? "0 8px 32px 0 rgba(31, 38, 135, 0.15)" : "none",
    zIndex: showDropdown ? 100 : -10,
    padding: "1rem 0.5rem",
    marginTop: "0.5rem", // Piccolo gap tra pulsante e dropdown
    opacity: showDropdown ? 1 : 0,
    transform: showDropdown
      ? "translateY(0) scale(1)"
      : "translateY(-8px) scale(0.95)",
    transformOrigin: "top right", // Cambiato a "top right" per allineamento migliore
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    pointerEvents: showDropdown ? "auto" : "none",
    visibility: showDropdown ? "visible" : "hidden",
  };

  return (
    <DefaultContainer className="relative">
      <div className="flex items-center justify-center w-full absolute top-20 mx-auto">
        <h1 className="z-40 text-5xl text-[#6331c9] dark:text-[#D2D6EF]">
          Your Exams
        </h1>
        <div className="ml-50 z-50 w-40 flex flex-row  gap-10 items-center justify-center">
          {/* Add Exam Button */}
          <button
            className={`z-50 cursor-pointer px-3 py-3 hover:px-8 rounded-full text-3xl transition-all duration-300 ${
              dark ? buttonDark : buttonLight
            }`}
            onClick={() => setShowModal(true)}
            aria-label="Add Exam"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
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
          {/* Settings Button */}

          {/* Settings Button */}
          <div className="relative">
            <button
              className={`z-50 cursor-pointer px-3 py-3 hover:px-8  rounded-full text-3xl transition-all duration-300 ${
                dark ? buttonDark : buttonLight
              }`}
              aria-label="Settings"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDropdown((prev) => !prev);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.527-.878 3.31.905 2.432 2.432a1.724 1.724 0 001.01 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.878 1.527-.905 3.31-2.432 2.432a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.01c-1.527.878-3.31-.905-2.432-2.432a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.573c-.878-1.527.905-3.31 2.432-2.432.996.574 2.25.09 2.573-1.01z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className={`absolute top-full right-0 mt-2 min-w-[220px] rounded-2xl shadow-lg z-50 p-4 animate-in fade-in-0 zoom-in-95 duration-200 ${
                  dark
                    ? "bg-[#181825] text-[#D2D6EF]"
                    : "bg-white text-[#6331c9]"
                }`}
                style={{
                  transformOrigin: "top right",
                  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                }}
              >
                {/* Toggle theme */}
                <button
                  className={`flex items-center gap-2 w-full bg-transparent border-none font-semibold text-base p-2 rounded-lg cursor-pointer transition-all duration-150 hover:${
                    dark ? "bg-[#232336]" : "bg-gray-100"
                  }`}
                  onClick={() => {
                    toggleTheme(!dark);
                    setShowDropdown(false);
                  }}
                >
                  {dark ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="5" fill="#D2D6EF" />
                      <g stroke="#D2D6EF" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="2" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="22" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="2" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="22" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </g>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 12.79A9 9 0 0111.21 3a7 7 0 100 14 9 9 0 009.79-4.21z"
                        fill="#6331c9"
                      />
                    </svg>
                  )}
                  {dark ? "Light Mode" : "Dark Mode"}
                </button>

                <div
                  className={`h-px my-2 ${
                    dark ? "bg-[#232336]" : "bg-gray-200"
                  }`}
                />

                {/* Integration info */}
                <div className="flex items-center gap-2 text-base p-2 opacity-85">
                  {integrationActive === null ? (
                    <svg width="20" height="20" fill="none">
                      <circle
                        cx="10"
                        cy="10"
                        r="9"
                        stroke="#aaa"
                        strokeWidth="2"
                      />
                      <circle cx="10" cy="10" r="4" fill="#aaa" />
                    </svg>
                  ) : integrationActive ? (
                    <svg width="20" height="20" fill="none">
                      <circle
                        cx="10"
                        cy="10"
                        r="9"
                        stroke="#2ecc40"
                        strokeWidth="2"
                      />
                      <path
                        d="M7 10.5l2 2 4-4"
                        stroke="#2ecc40"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none">
                      <circle
                        cx="10"
                        cy="10"
                        r="9"
                        stroke="#e74c3c"
                        strokeWidth="2"
                      />
                      <line
                        x1="7"
                        y1="7"
                        x2="13"
                        y2="13"
                        stroke="#e74c3c"
                        strokeWidth="2"
                      />
                      <line
                        x1="13"
                        y1="7"
                        x2="7"
                        y2="13"
                        stroke="#e74c3c"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                  {integrationActive === null
                    ? "Checking integration..."
                    : integrationActive
                    ? "Ergo's Integration active"
                    : "Ergo's Integration disabled"}
                </div>

                <div
                  className={`h-px my-2 ${
                    dark ? "bg-[#232336]" : "bg-gray-200"
                  }`}
                />

                {/* Version */}
                <div className="flex items-center gap-2 text-base p-2 opacity-85">
                  <svg width="20" height="20" fill="none">
                    <circle
                      cx="10"
                      cy="10"
                      r="9"
                      stroke="#6331c9"
                      strokeWidth="2"
                    />
                    <text
                      x="10"
                      y="15"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6331c9"
                    >
                      i
                    </text>
                  </svg>
                  Version: v.{appVersion}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-40 flex flex-wrap p-10 gap-8 justify-center overflow-y-auto custom-scrollbar pb-18 z-10">
  {exams.length === 0 ? (
    <span className="text-[#6331c9] dark:text-[#D2D6EF] text-lg font-semibold w-full text-center">
      You've got a big empty canvas, fill it!
    </span>
  ) : (
    [...exams]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((exam, idx) => (
        <ExamFolder
          key={idx}
          exam={exam}
          onDelete={() => setDeleteModal({ open: true, exam: exam.name })}
          onRename={handleRenameExam}
          onColor={handleColorExam}
        />
      ))
  )}
</div>

      {/* Modal */}
      {showModal && (
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
              Create new exam folder
            </h2>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Name"
              className={`border px-3 py-2 rounded mb-4 w-64 ${
                dark ? "bg-[#232336] text-white border-[#6331c9]" : ""
              }`}
            />
            <div className="flex gap-2">
              <button
                className={`cursor-pointer px-4 py-2 rounded-2xl font-semibold ${
                  dark ? buttonDark : buttonLight
                }`}
                onClick={handleAddExam}
              >
                Add
              </button>
              <button
                className={`cursor-pointer px-4 py-2 rounded-2xl font-semibold ${
                  dark
                    ? "bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                    : "bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                }`}
                onClick={() => setShowModal(false)}
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
              Delete Exam
            </h2>
            <div className="mb-4 text-center text-[#6331c9] dark:text-[#D2D6EF]">
              Are you sure you want to delete{" "}
              <b>
                {deleteModal.exam
                  ? deleteModal.exam.slice(0, 10) +
                    (deleteModal.exam.length > 10 ? "..." : "")
                  : ""}
              </b>
              ?
            </div>
            <div className="flex gap-2">
              <button
                className={`cursor-pointer px-4 py-2 rounded-2xl font-semibold ${
                  dark ? buttonDark : buttonLight
                }`}
                onClick={confirmDeleteExam}
              >
                Delete
              </button>
              <button
                className="cursor-pointer px-4 py-2 rounded-2xl font-semibold bg-gray-300 text-[#6331c9] hover:bg-[#b8bce0]"
                onClick={() => setDeleteModal({ open: false, exam: null })}
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
              Rename exam folder
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
