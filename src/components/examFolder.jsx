import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ContextMenuComponent } from "@syncfusion/ej2-react-navigations";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-icons/styles/material.css";
import "@syncfusion/ej2-react-navigations/styles/material.css";

export default function ExamFolder({ exam, onRename, onDelete }) {
  const navigate = useNavigate();
  const contextMenuRef = useRef();

  const items = [
    { text: "Rename", iconCss: "e-icons e-edit", id: "rename" },
    { text: "Delete", iconCss: "e-icons e-trash", id: "delete" },
  ];

  const handleMenuClick = (args) => {
    if (args.item.id === "rename" && onRename) onRename(exam);
    if (args.item.id === "delete" && onDelete) onDelete(exam);
  };

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
      onClick={() => navigate("/slides", { state: { exam } })}
      onContextMenu={handleContextMenu}
    >
      <span role="img" aria-label="folder" className="text-8xl">
        📁
      </span>
      <span className="mt-2 text-[#6331c9] font-bold">{trimName(exam)}</span>
      <ContextMenuComponent
        ref={contextMenuRef}
        items={items}
        select={handleMenuClick}
        target=""
      />
    </div>
  );
}
