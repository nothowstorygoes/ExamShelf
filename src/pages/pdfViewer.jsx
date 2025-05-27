import * as React from 'react';
import DefaultContainer from "../components/defaultContainter";
import "./syncfusion.css";
import { useNavigate } from 'react-router-dom';
import { PdfViewerComponent, Inject, Toolbar, Magnification, Navigation, BookmarkView, ThumbnailView, Print, TextSelection, TextSearch } from '@syncfusion/ej2-react-pdfviewer';
import { usePDFCloseButton } from '../components/closebutton';

export default function PDFViewer() {
    const navigate = useNavigate();

        function unloadDocument() {
        var pdfviewer = document.getElementById('container').ej2_instances[0];
        pdfviewer.unload();
    }

    function destroy() {
        var pdfviewer = document.getElementById('container').ej2_instances[0];
        pdfviewer.destroy();
    }



    // Usa il hook per aggiungere il pulsante di chiusura
    usePDFCloseButton(() => {unloadDocument(); navigate("/home"); destroy()});

    return (
        <DefaultContainer>
            <div className="w-full h-full flex flex-col justify-end">
                <PdfViewerComponent
                    id="container"
                    documentPath={window.location.origin + "/assets/intro.pdf"}
                    resourceUrl={window.location.origin + "/assets/ej2-pdfviewer-lib"}
                    style={{ width: "100%", height: "calc(100vh - 32px)" }}
                    initialRenderPages ={15}
                    toolbarSettings={{
                        showTooltip: true,
                        toolbarItems: ['PageNavigationTool', 'MagnificationTool', 'SearchOption', 'PanTool', 'PrintOption', 'SelectionTool']
                    }}
                >
                    <Inject services={[
                        Toolbar, Magnification, Navigation, BookmarkView, ThumbnailView,
                        Print, TextSelection, TextSearch
                    ]} />
                </PdfViewerComponent>
            </div>
        </DefaultContainer>
    );
}