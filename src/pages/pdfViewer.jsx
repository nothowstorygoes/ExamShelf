import * as React from "react";
import DefaultContainer from "../components/defaultContainter";
import "./syncfusion.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PdfViewerComponent,
  Inject,
  Toolbar,
  Magnification,
  Navigation,
  BookmarkView,
  ThumbnailView,
  Print,
  TextSelection,
  TextSearch,
} from "@syncfusion/ej2-react-pdfviewer";
import { usePDFCloseButton } from "../components/closebutton";

export default function PDFViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const exam = location.state?.exam;
  const file = location.state?.file;
  const [pdfBase64, setPdfBase64] = React.useState(null);

  React.useEffect(() => {
    if (exam && file) {
      window.electron.invoke("get-pdf-base64", exam, file).then((base64) => {
        if (base64) setPdfBase64("data:application/pdf;base64," + base64);
      });
    }
  }, [exam, file]);

  function unloadDocument() {
    var pdfviewer = document.getElementById("container").ej2_instances[0];
    pdfviewer.unload();
  }

  function destroy() {
    var pdfviewer = document.getElementById("container").ej2_instances[0];
    pdfviewer.destroy();
  }

  usePDFCloseButton(() => {
    unloadDocument();
    navigate(-1);
    destroy();
  });
  
  return (
    <DefaultContainer>
      <div className="w-full h-full flex flex-col justify-end">
        <PdfViewerComponent
          id="container"
          documentPath={pdfBase64}
          resourceUrl="https://cdn.syncfusion.com/ej2/23.1.41/dist/ej2-pdfviewer-lib"
          style={{ width: "100%", height: "calc(100vh - 32px)" }}
          initialRenderPages={15}
          toolbarSettings={{
            showTooltip: true,
            toolbarItems: [
              "PageNavigationTool",
              "MagnificationTool",
              "SearchOption",
              "PanTool",
              "PrintOption",
              "SelectionTool",
            ],
          }}
        >
          <Inject
            services={[
              Toolbar,
              Magnification,
              Navigation,
              BookmarkView,
              ThumbnailView,
              Print,
              TextSelection,
              TextSearch,
            ]}
          />
        </PdfViewerComponent>
      </div>
    </DefaultContainer>
  );
}
