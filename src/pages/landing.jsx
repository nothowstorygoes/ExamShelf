import React from 'react';
import DefaultContainer from '../components/defaultContainter';
import { ThemeProvider } from '../components/themeProvider';
import Vara from "vara";
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useState } from 'react';

export default function Landing() {
    const navigate = useNavigate();
    const [integration, setIntegration] = useState(false);
    const [temp, setTemp] = useState(false); 
    useEffect(() => {
        window.electron.invoke("get-onboarding-data").then((res) => {
            if (res) {
                navigate("/home");
            }
        });
        window.electron.invoke("get-cogito-data").then((res) => {
            if (res) {
                setIntegration(true)
            }
        });
        const container = document.getElementById("vara-title");
        if (container) container.innerHTML = "";
        new Vara(
            "#vara-title",
            "https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Satisfy/SatisfySL.json",
            [
                {
                    text: "Welcome to ExamShelf",
                    textAlign: "center",
                    y: 20,
                    fromCurrentPosition: { y: false },
                    duration: 2000,
                    color: "#6331c9",
                    autoAnimation: true,
                },
            ],
            {
                fontSize: 52,
                strokeWidth: 3,
            }
        );
    }, []);
    return (
        <DefaultContainer>
            <div id="vara-title" className="w-120 flex justify-center items-center"></div>

            <div className="mt-32 flex justify-center items-center flex-col">
                <p className="text-[#6331c9] text-center">
                    All your university notes and lecture PDFs, organized in one place. <br />Study <b>smarter</b>, not harder.
                </p>
                \
            </div>
            {!integration ? (
                <p className='text-[#6331c9] text-center absolute bottom-2 w-120'>
                    <b>ExamShelf</b> is part of <b>Ergo Ecosystem</b>, check out{" "}
                    <a
                        href="#"
                        onClick={e => {
                            e.preventDefault();
                            window.electron.invoke("open-external", "https://github.com/nothowstorygoes/cogito");
                        }}
                        className="text-[#6331c9] font-bold"
                    >
                        Cogito
                    </a>{" "}
                    to easily improve your performance!
                </p>
            ) : (
                 <div className="flex items-center justify-center absolute bottom-2 w-120">
                    <input
                        type="checkbox"
                        className="mr-2"
                        checked={temp}
                        onChange={e => setTemp(e.target.checked)} // aggiorna temp
                    />
                    <label className="text-[#6331c9]">
                        Use ergo's integration system with Cogito
                    </label>
                </div>
            )}
        </DefaultContainer>

    )
}