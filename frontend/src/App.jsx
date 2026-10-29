import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import Estudiantes from "@/pages/Estudiantes"; // <-- Importamos la vista real
import Movilidades from "@/pages/Movilidades";
import Expediente from "@/pages/Expediente";


import './App.css';

const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground mt-2">Bienvenida, Annet.</p></div>;

function App() {
    return (
        <BrowserRouter>
            <div className="flex h-screen bg-background text-foreground overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/estudiantes" element={<Estudiantes />} /> {/* <-- Usamos el componente real */}
                        <Route path="/movilidades" element={<Movilidades />} />
                        <Route path="/movilidades/:id" element={<Expediente />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;