import { Link, useLocation } from "react-router-dom";
import { Users, Plane, LayoutDashboard, FileText } from "lucide-react";

export function Sidebar() {
    const location = useLocation(); // Nos dice en qué URL estamos parados

    // Lista de rutas para iterar y no repetir código
    const menuItems = [
        { name: "Dashboard", path: "/", icon: LayoutDashboard },
        { name: "Estudiantes", path: "/estudiantes", icon: Users },
        { name: "Movilidades", path: "/movilidades", icon: Plane },
        { name: "Reportes", path: "/reportes", icon: FileText },
    ];

    return (
        <aside className="w-64 border-r border-border bg-card h-screen flex flex-col">
            {/* Logo / Cabecera del menú */}
            <div className="h-16 flex items-center px-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                    Movilidad UNCP
                </h2>
            </div>

            {/* Enlaces de navegación */}
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-primary text-primary-foreground" // Estilo oscuro activo (usando colores de v4)
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground" // Estilo inactivo
                            }`}
                        >
                            <Icon className="size-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}