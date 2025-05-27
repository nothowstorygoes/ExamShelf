import React from "react";
import { useTheme } from "./themeProvider";

export default function TitleBar() {
    const { dark } = useTheme();

    // Colori dinamici
    const iconColor = dark ? "#D2D6EF" : "#6331c9";
    const bgColor = dark ? "#181825" : "#D2D6EF";

    return (
        <div
            className="fixed top-0 left-0 w-full flex items-center justify-end"
            style={{ WebkitAppRegion: "drag", height: 32 }}
        >
            {/* Right: Window Controls */}
            <div className="flex gap-2" style={{ WebkitAppRegion: "no-drag", padding: 10 }}>
                
                {/* Minimize Button */}
                <button
                    onClick={() => window.electron.send("minimize")}
                    className="p-0 m-0 bg-transparent border-none outline-none cursor-pointer"
                    style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="8" width="10" height="2" rx="1" fill={iconColor} />
                    </svg>
                </button>
                <button onClick={() => window.electron.send("maximize")}
                    className="p-0 m-0 bg-transparent border-none outline-none cursor-pointer"
                    style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="3" width="10" height="10" rx="2" stroke={iconColor} strokeWidth="2" fill="none" />
                    </svg>
                </button>
                {/* Close Button */}
                <button
                    onClick={() => window.electron.send("close")}
                    className="p-0 m-0 bg-transparent border-none outline-none cursor-pointer"
                    style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <line x1="4" y1="4" x2="12" y2="12" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
                        <line x1="12" y1="4" x2="4" y2="12" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}