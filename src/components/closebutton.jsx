import { useEffect } from 'react';

export const usePDFCloseButton = (onClose) => {
    useEffect(() => {
        // CSS per il pulsante integrato nella toolbar
        const style = document.createElement('style');
        style.id = 'pdf-close-button-styles';
        style.textContent = `
            .custom-close-btn {
                position: absolute !important;
                left: 530px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                background: none !important;
                border: none !important;
                font-size: 20px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                color: #666 !important;
                width: 30px !important;
                height: 30px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 50% !important;
                transition: all 0.2s ease !important;
                z-index: 1000 !important;
                font-family: Arial, sans-serif !important;
            }
            .custom-close-btn:hover {
                background-color: rgba(0,0,0,0.1) !important;
                color: #333 !important;
            }
            .custom-close-btn:active {
                background-color: rgba(0,0,0,0.2) !important;
            }
        `;

        // Aggiungi gli stili se non esistono già
        if (!document.getElementById('pdf-close-button-styles')) {
            document.head.appendChild(style);
        }

        

        // Funzione per aggiungere il pulsante
        const addCloseButton = () => {
            const toolbar = document.querySelector('.e-pv-toolbar');
            if (toolbar && !toolbar.querySelector('.custom-close-btn')) {
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '×';
                closeBtn.className = 'custom-close-btn';
                closeBtn.title = 'Chiudi PDF';
                closeBtn.setAttribute('aria-label', 'Chiudi PDF');
                
                // Event handler per il click
                closeBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                };

                // Aggiungi il pulsante alla toolbar
                toolbar.appendChild(closeBtn);
            }
        };

        // Prova ad aggiungere il pulsante immediatamente
        addCloseButton();

        // Se non riesce, riprova dopo un breve delay
        const timer1 = setTimeout(addCloseButton, 100);
        const timer2 = setTimeout(addCloseButton, 500);
        const timer3 = setTimeout(addCloseButton, 1000);

        // Observer per rilevare quando la toolbar viene creata
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList?.contains('e-pv-toolbar') || 
                                node.querySelector?.('.e-pv-toolbar')) {
                                setTimeout(addCloseButton, 50);
                            }
                        }
                    });
                }
            });
        });

        // Osserva i cambiamenti nel DOM
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Cleanup
        return () => {
            const existingStyle = document.getElementById('pdf-close-button-styles');
            if (existingStyle) {
                document.head.removeChild(existingStyle);
            }
            
            const existingButton = document.querySelector('.custom-close-btn');
            if (existingButton) {
                existingButton.remove();
            }

            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            observer.disconnect();
        };
    }, [onClose]);
};