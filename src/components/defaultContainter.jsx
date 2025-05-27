import { useTheme } from "../components/themeProvider";
import TitleBar from "../components/titleBar";

export default function DefaultContainer({ children }) {
    const { dark } = useTheme();
    return (
        <main className={`w-screen h-screen overflow-hidden flex justify-center items-center flex-col transition-colors duration-300
            ${dark ? "bg-[#181825]" : "bg-[#D2D6EF]"}`}>
            <TitleBar />
            {children}
        </main>)
}
