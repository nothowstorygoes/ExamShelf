import * as React from "react";
const FolderSvg = ({base, accent}) => (
  <svg
    viewBox="0 0 1024 1024"
    className="icon"
    width={120}
    height={120}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g strokeWidth={0} />
    <g strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M853.333 256h-384L384 170.667H170.667c-46.934 0-85.334 38.4-85.334 85.333v170.667h853.334v-85.334c0-46.933-38.4-85.333-85.334-85.333"
      fill={accent}
    />
    <path
      d="M853.333 256H170.667c-46.934 0-85.334 38.4-85.334 85.333V768c0 46.933 38.4 85.333 85.334 85.333h682.666c46.934 0 85.334-38.4 85.334-85.333V341.333c0-46.933-38.4-85.333-85.334-85.333"
      fill={base}
    />
  </svg>
);
export default FolderSvg;
