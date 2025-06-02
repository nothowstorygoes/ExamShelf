import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContextMenuComponent } from "@syncfusion/ej2-react-navigations";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-icons/styles/material.css";
import "@syncfusion/ej2-react-navigations/styles/material.css";
import FolderSvg from "./folderSvg";
import { useTheme } from "../components/themeProvider";
import { useEffect } from "react";

export default function ExamFolder({ exam, onRename, onDelete, onColor }) {
  const navigate = useNavigate();
  const contextMenuRef = useRef();
  const { dark } = useTheme();

const colorOptions = [
  { id: "Purple", base: "#6331c9", accent: "#abb4ed" },      // viola chiaro
  { id: "Red", base: "#e63946", accent: "#ffb3b3" },         // rosso chiaro
  { id: "Blue", base: "#457b9d", accent: "#a8dadc" },        // azzurro chiaro
  { id: "Orange", base: "#f4a261", accent: "#ffe0b2" },      // arancione chiaro
  { id: "Green", base: "#2a9d8f", accent: "#8fdcc1" },       // verde chiaro
];

  // Trova il colore corrispondente al nome nel json, default Purple
  const getColorObj = () => {
    const colorName =
      typeof exam.color === "string"
        ? exam.color
        : (exam.color && exam.color.id) || "Purple";
    return colorOptions.find((c) => c.id === colorName) || colorOptions[0];
  };

  const [selectedColor, setSelectedColor] = useState(getColorObj());

  useEffect(() => {
    setSelectedColor(getColorObj());
    // eslint-disable-next-line
  }, [exam]);

  // Use HTML string for text (Syncfusion limitation)
  const items = [
    { text: "Rename", iconCss: "e-icons e-edit", id: "rename" },
    { text: "Delete", iconCss: "e-icons e-trash", id: "delete" },
    {
      text: "Color",
      iconCss: "e-icons e-palette",
      id: "color",
      items: colorOptions.map((color) => ({
        text: color.id,
        id: color.id,
      })),
    },
  ];
  const handleMenuClick = (args) => {
    if (args.item.id === "rename" && onRename) onRename(exam.name);
    if (args.item.id === "delete" && onDelete) onDelete(exam.name);
    const color = colorOptions.find((c) => c.id === args.item.id);
    if (color && onColor) {
      onColor(exam.name, color.id);
    }
  };

  console.log("ExamFolder rendered with exam:", exam);

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (contextMenuRef.current) {
      contextMenuRef.current.open(e.pageY, e.pageX);
    }
  };

  const trimName = (name) => {
    return name.length > 10 ? name.slice(0, 10) + "..." : name;
  };

  return (
    <div
      className="flex flex-col items-center cursor-pointer"
      onClick={() => navigate("/slides", { state: { exam: exam.name } })}
      onContextMenu={handleContextMenu}
    >
      <span role="img" aria-label="folder" className="text-8xl">
        <FolderSvg base={selectedColor.base} accent={selectedColor.accent} />
      </span>
      <span
        className={`mt-2 font-bold ${
          dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
        }`}
      >
        {trimName(exam.name)}
      </span>
      <ContextMenuComponent
        ref={contextMenuRef}
        items={items}
        select={handleMenuClick}
        target=""
      />
    </div>
  );
}
