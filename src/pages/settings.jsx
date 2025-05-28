import DefaultContainer from "../components/defaultContainter";
import { useTheme } from "../components/themeProvider";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const buttonLight = "bg-[#6331c9] text-white hover:bg-[#4b2496]";
  const buttonDark =
    "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] border border-[#D2D6EF]";

  return (
    <DefaultContainer className="flex flex-col items-center justify-center min-h-screen">
      <h1 className={`text-2xl font-bold mb-10 ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>
        Settings
      </h1>
      <button
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        className={`cursor-pointer p-2 rounded-full border-2 transition-colors duration-200 mb-10 ${
          dark
            ? "border-[#6331c9] bg-[#181825]"
            : "border-[#6331c9] bg-[#f5f5fa]"
        }`}
        onClick={() => toggleTheme(!dark)}
      >
        {dark ? (
          // Sun SVG for switching to light mode
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="#6331c9" />
            <g stroke="#6331c9" strokeWidth="2" strokeLinecap="round">
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
          // Moon SVG for switching to dark mode
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.79A9 9 0 0111.21 3a7 7 0 100 14 9 9 0 009.79-4.21z"
              fill="#6331c9"
            />
          </svg>
        )}
      </button>
      <button
        className={`rounded-3xl w-35 h-10 font-semibold hover:w-40 cursor-pointer transition-all duration-300 ${
          dark ? buttonDark : buttonLight
        }`}
        onClick={() => navigate(-1)}
      >
        Go Back
      </button>
    </DefaultContainer>
  );
}