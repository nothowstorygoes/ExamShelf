import DefaultContainer from "../components/defaultContainter";
import React, { useEffect, useState } from "react";
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
  const { dark } = useTheme();

  // Carica exams.json al mount
  useEffect(() => {
    window.electron.invoke("load-exams-json").then((data) => {
      if (Array.isArray(data)) setExams(data);
    });
  }, []);

  const handleAddExam = async () => {
    if (examName.trim() === "") return;
    const updatedExams = [...exams, examName.trim()];
    setExams(updatedExams);
    setExamName("");
    setShowModal(false);
    await window.electron.invoke("save-exams-json", updatedExams);
    await window.electron.invoke("create-exam-folder", examName.trim());
    await window.electron.invoke("create-exam-json", examName.trim());
  };

  // Elimina esame dal json e cartella
  const handleDeleteExam = async (examToDelete) => {
    const updatedExams = exams.filter((exam) => exam !== examToDelete);
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
    const updatedExams = exams.map((exam) =>
      exam === renameModal.oldName ? newName : exam
    );
    setExams(updatedExams);
    setRenameModal({ open: false, oldName: "" });
    setRenameValue("");
    await window.electron.invoke("save-exams-json", updatedExams);
  };

  const handleRenameExam = (oldExamName) => {
    setRenameModal({ open: true, oldName: oldExamName });
    setRenameValue(oldExamName);
  };

  // Palette come settings.jsx
  const buttonLight = "bg-[#6331c9] text-white hover:bg-[#4b2496]";
  const buttonDark =
    "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] border border-[#D2D6EF]";

  return (
    <DefaultContainer className="relative">
      <div className="absolute top-20 right-10 w-40 flex md:flex-row lg:flex-col gap-10 items-center justify-center">
        <button
          className={`z-50 cursor-pointer px-3 py-3 md:hover:px-8 lg:hover:px-3 lg:hover:py-6 rounded-full text-3xl transition-all duration-300 ${
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
        <button
          className={`z-50 cursor-pointer px-3 py-3 rounded-full text-3xl md:hover:px-8 lg:hover:px-3 lg:hover:py-6 transition-all duration-300 ${
            dark ? buttonDark : buttonLight
          }`}
          onClick={() => navigate("/settings")}
          aria-label="Settings"
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
      </div>
      <div className="flex items-center justify-center w-full absolute top-20 mx-auto">
        <h1 className="text-5xl text-[#6331c9] dark:text-[#D2D6EF]">
          Your Exams
        </h1>
      </div>
      <div className="flex flex-wrap gap-6 mt-6 items-center justify-center">
        {exams.length === 0 ? (
          <span className="text-[#6331c9] text-lg font-semibold w-full text-center">
            You've got a big empty canvas, fill it!
          </span>
        ) : (
          exams.map((exam, idx) => (
            <ExamFolder
              key={idx}
              exam={exam}
              onDelete={handleDeleteExam}
              onRename={handleRenameExam}
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
    </DefaultContainer>
  );
}
