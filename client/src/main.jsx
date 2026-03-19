import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from './store/Provider';
import { routes } from './routes';
import Chatbot from './components/ChatBot';
import ModalChat from './components/chat/ModalChat';

function GlobalWidgets() {
    const { pathname } = useLocation();
    if (pathname.startsWith('/admin')) return null;
    return (
        <>
            <ModalChat />
            <Chatbot />
        </>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider>
            <Router>
                <GlobalWidgets />
                <Routes>
                    {routes.map((route, index) => (
                        <Route key={index} path={route.path} element={route.component} />
                    ))}
                </Routes>
            </Router>
        </Provider>
    </StrictMode>,
);
