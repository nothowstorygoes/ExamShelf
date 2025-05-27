import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DefaultContainer from "../components/defaultContainter";
import { useEffect, useState } from "react";

export default function GetStarted() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [showButton, setShowButton] = useState(false);
  const userchoice = useLocation().state.temp;

  useEffect(() => {
    if (userchoice) {
      window.electron.invoke("get-cogito-data").then((res) => {
        if (res) {
          const autoSet = () => {
            setError("");
            window.electron
              .invoke("set-onboarding-data", {
                name: res.name || "",
                onboarded: true,
                dark: res.dark || false,
                ergoIntegration: true,
                propic: res.propic || "/assets/empty.png",
              })
              .then(() => {
                navigate("/home");
              });
          };
          autoSet();
        }
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name) {
      setError("Oops you missed something!");
      return;
    }
    await window.electron.invoke("set-onboarding-data", {
      name: name,
      onboarded: true,
      ergoIntegration: false,
      dark: false,
      propic: "assets/empty.png",
    });
    navigate("/home");
  };

  return (
    <DefaultContainer>
      <h2 className="text-3xl font-bold text-[#6331c9]">Get Started</h2>
      <form
        className="w-2/3 flex flex-col gap-6 justify-center items-center"
        onSubmit={handleSubmit}
      >
        {/* Name input */}
        <div className="flex flex-col items-center w-full">
          <p className="text-xl text-center text-[#6331c9] mb-6">
            Tell us a little about yourself!
          </p>
          <label className="block mb-2 text-[#6331c9] font-semibold text-center">
            How do you wish to be called?
          </label>
          <input
            type="text"
            className="text-center w-70 border border-[#a6aae3] rounded px-3 py-2 focus:outline-none"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowButton(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                e.preventDefault(); // Prevent form submit!
                setShowButton(true);
              }
            }}
          />
        </div>
        {/* Error message */}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* Submit button only when all fields are filled */}
        {showButton && name && (
          <button
            type="submit"
            className="mt-8 w-30 bg-[#a6aae3] text-[#6331c9] cursor-pointer rounded-4xl py-2 font-semibold hover:bg-[#6331c9] hover:text-white hover:rounded-2xl hover:w-70 transition-all duration-300"
          >
            Let's start
          </button>
        )}
      </form>
    </DefaultContainer>
  );
}
