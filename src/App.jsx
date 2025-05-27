import { Routes, Route, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import Landing from "./pages/landing"; 
import GetStarted from "./pages/getStarted";
import Home from "./pages/home";
import PDFViewer from "./pages/pdfViewer"


export default function App() {
  const navigate = useNavigate();

  // Espone la funzione globale per la navigazione da main process
  useEffect(() => {
    window.navigateToRoute = (route) => {
      navigate(route);
    };
    return () => {
      delete window.navigateToRoute;
    };
  }, [navigate]);

  useEffect(() => {
    const handler = (event, route) => {
      navigate(route);
    };
    window.electron.receive('navigate', handler);
    return () => window.electron.removeListener('navigate', handler);
  }, [navigate]);

  // Gestione dark mode
  useEffect(() => {
    async function setDarkModeClass() {
      const onboarding = await window.electron.invoke("get-onboarding-data");
      if (onboarding?.dark) {
        document.body.className = "dark";
      } else {
        document.body.className = "";
      }
    }

    // Aggiorna la dark mode ogni volta che la pagina cambia
    setDarkModeClass();
    window.addEventListener("focus", setDarkModeClass);
    return () => window.removeEventListener("focus", setDarkModeClass);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/getStarted" element={<GetStarted />} />
      <Route path="/home" element={<Home />} />
      <Route path="/PDFViewer" element={<PDFViewer/>}/>
    </Routes>
  );
}