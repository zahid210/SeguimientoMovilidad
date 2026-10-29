import { Link, useLocation } from "react-router-dom";
import { Users, Plane, LayoutDashboard, FileText, GraduationCap } from "lucide-react";

const menuItems = [
    { name: "Panel general", path: "/", icon: LayoutDashboard },
    { name: "Estudiantes", path: "/estudiantes", icon: Users },
    { name: "Movilidades", path: "/movilidades", icon: Plane },
    { name: "Reportes", path: "/reportes", icon: FileText },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
            <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                <GraduationCap className="size-5 text-primary" />
                <div>
                    <h2 className="text-sm font-semibold leading-tight tracking-tight">
                        Movilidad UNCP
                    </h2>
                    <p className="text-[11px] text-muted-foreground">Seguimiento estudiantil</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <Icon className="size-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-border p-4">
                <p className="text-xs text-muted-foreground">
                    Uso local · Los datos y PDFs se guardan en este equipo.
                </p>
            </div>
        </aside>
    );
}
