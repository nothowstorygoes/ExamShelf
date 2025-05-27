import DefaultContainer from "../components/defaultContainter";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [examName, setExamName] = useState("");

    // Carica exams.json al mount
    useEffect(() => {
        window.electron.invoke("load-exams-json").then((data) => {
            if (Array.isArray(data)) setExams(data);
        });
    }, []);

    // Aggiungi nuovo esame e salva exams.json
    const handleAddExam = () => {
        if (examName.trim() === "") return;
        const updatedExams = [...exams, examName.trim()];
        setExams(updatedExams);
        setExamName("");
        setShowModal(false);
        window.electron.invoke("save-exams-json", updatedExams);
    };

    return (
        <DefaultContainer>
            <button
                className="bg-[#6331c9] text-white px-4 py-2 rounded-2xl mb-4"
                onClick={() => setShowModal(true)}
            >
                Aggiungi Esame
            </button>
            <button onClick={() => navigate("/PDFViewer")}>Vedi</button>

            <div className="flex flex-wrap gap-4 mt-6">
                {exams.map((exam, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                        <span role="img" aria-label="folder" className="text-5xl">📁</span>
                        <span className="mt-2 text-[#6331c9] font-bold">{exam}</span>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <h2 className="mb-4 text-lg font-bold text-[#6331c9]">Aggiungi nuovo esame</h2>
                        <input
                            type="text"
                            value={examName}
                            onChange={e => setExamName(e.target.value)}
                            placeholder="Nome esame"
                            className="border px-3 py-2 rounded mb-4 w-64"
                        />
                        <div className="flex gap-2">
                            <button
                                className="bg-[#6331c9] text-white px-4 py-2 rounded-2xl"
                                onClick={handleAddExam}
                            >
                                Aggiungi
                            </button>
                            <button
                                className="bg-gray-300 text-[#6331c9] px-4 py-2 rounded-2xl"
                                onClick={() => setShowModal(false)}
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DefaultContainer>
    );
}