import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Estudiantes from "@/pages/Estudiantes";
import Movilidades from "@/pages/Movilidades";
import Expediente from "@/pages/Expediente";
import Reportes from "@/pages/Reportes";
import { Button } from "@/components/ui/button";

function NoEncontrada() {
    return (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-6xl font-bold text-muted-foreground/40">404</p>
            <div>
                <h1 className="text-xl font-semibold">Página no encontrada</h1>
                <p className="text-muted-foreground">La dirección que buscas no existe en el sistema.</p>
            </div>
            <Button asChild>
                <Link to="/">Volver al panel</Link>
            </Button>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <div className="flex h-screen bg-background text-foreground overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/estudiantes" element={<Estudiantes />} />
                        <Route path="/movilidades" element={<Movilidades />} />
                        <Route path="/movilidades/:id" element={<Expediente />} />
                        <Route path="/reportes" element={<Reportes />} />
                        <Route path="*" element={<NoEncontrada />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
