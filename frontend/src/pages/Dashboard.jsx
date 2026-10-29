import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, URL_EXPORT } from '@/lib/axios';
import { Encabezado, Aviso, EstadoMovilidadBadge, AlertaMonitoreo, BarraProgreso } from '@/components/comunes';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard, Users, Plane, FolderCheck, FolderClock, AlertTriangle, CalendarClock,
    Download, Plus, ArrowRight
} from 'lucide-react';
import { ESTADOS_MOVILIDAD } from '@/lib/catalogos';

function Tarjeta({ icono: Icono, etiqueta, valor, detalle, tono = 'neutro', onClick }) {
    const tonos = {
        neutro: 'text-foreground',
        ok: 'text-emerald-600',
        alerta: 'text-amber-600',
        peligro: 'text-rose-600'
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border border-border bg-card p-4 text-left transition-colors ${onClick ? 'hover:bg-muted/50' : 'cursor-default'}`}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
                <Icono className={`size-4 ${tonos[tono]}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${tonos[tono]}`}>{valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
        </button>
    );
}

export default function Dashboard() {
    const [movilidades, setMovilidades] = useState([]);
    const [totalEstudiantes, setTotalEstudiantes] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        let activo = true;

        (async () => {
            try {
                const [resMovilidades, resEstudiantes] = await Promise.all([
                    api.get('/movilidades'),
                    api.get('/estudiantes')
                ]);
                if (!activo) return;
                if (resMovilidades.data.exito) setMovilidades(resMovilidades.data.datos);
                if (resEstudiantes.data.exito) setTotalEstudiantes(resEstudiantes.data.datos.length);
            } catch (err) {
                if (activo) setError(err.response?.data?.mensaje || 'No se pudo cargar el panel.');
            } finally {
                if (activo) setCargando(false);
            }
        })();

        return () => { activo = false; };
    }, []);

    const resumen = useMemo(() => {
        const activas = movilidades.filter((m) => m.estado === 'En Extranjero');
        const completos = movilidades.filter((m) => m.expediente_completo);
        const sinCompletar = movilidades.filter((m) => !m.expediente_completo);
        const vencidos = movilidades.filter((m) => m.monitoreo_vencido);
        const proximos = movilidades.filter(
            (m) => !m.monitoreo_vencido && m.proximo_monitoreo && m.dias_para_monitoreo !== null && m.dias_para_monitoreo <= 7
        );
        const sinMovilidad = Math.max(totalEstudiantes - movilidades.length, 0);

        return { activas, completos, sinCompletar, vencidos, proximos, sinMovilidad };
    }, [movilidades, totalEstudiantes]);

    const alertas = useMemo(() => {
        return movilidades
            .filter((m) => m.proximo_monitoreo && (m.monitoreo_vencido || (m.dias_para_monitoreo ?? 99) <= 7))
            .sort((a, b) => String(a.proximo_monitoreo).localeCompare(String(b.proximo_monitoreo)));
    }, [movilidades]);

    const porEstado = useMemo(() => {
        return ESTADOS_MOVILIDAD.map((estado) => ({
            estado,
            total: movilidades.filter((m) => m.estado === estado).length
        }));
    }, [movilidades]);

    const porPais = useMemo(() => {
        const mapa = new Map();
        for (const m of movilidades) {
            mapa.set(m.pais_destino, (mapa.get(m.pais_destino) || 0) + 1);
        }
        return [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    }, [movilidades]);

    const pendientes = useMemo(() => {
        return [...resumen.sinCompletar]
            .sort((a, b) => (a.documentos_entregados / (a.documentos_total || 1)) - (b.documentos_entregados / (b.documentos_total || 1)))
            .slice(0, 6);
    }, [resumen.sinCompletar]);

    return (
        <div className="p-8 space-y-6">
            <Encabezado
                icono={LayoutDashboard}
                titulo="Panel general"
                descripcion="Resumen del seguimiento de movilidad estudiantil."
            >
                <Button variant="outline" asChild>
                    <a href={URL_EXPORT} download>
                        <Download className="size-4" /> Exportar CSV
                    </a>
                </Button>
                <Button onClick={() => navigate('/movilidades')}>
                    <Plus className="size-4" /> Registrar movilidad
                </Button>
            </Encabezado>

            {error && <Aviso tipo="error">{error}</Aviso>}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Tarjeta
                    icono={Users}
                    etiqueta="Estudiantes"
                    valor={totalEstudiantes}
                    detalle={`${resumen.sinMovilidad} sin movilidad registrada`}
                    onClick={() => navigate('/estudiantes')}
                />
                <Tarjeta
                    icono={Plane}
                    etiqueta="En el extranjero"
                    valor={resumen.activas.length}
                    detalle={`${movilidades.length} movilidades en total`}
                    onClick={() => navigate('/movilidades')}
                />
                <Tarjeta
                    icono={FolderCheck}
                    etiqueta="Expedientes completos"
                    valor={resumen.completos.length}
                    detalle={`${resumen.sinCompletar.length} con documentos pendientes`}
                    tono="ok"
                    onClick={() => navigate('/movilidades?expediente=incompleto')}
                />
                <Tarjeta
                    icono={FolderClock}
                    etiqueta="Monitoreos vencidos"
                    valor={resumen.vencidos.length}
                    detalle={`${resumen.proximos.length} vencen en los próximos 7 días`}
                    tono={resumen.vencidos.length > 0 ? 'peligro' : 'ok'}
                    onClick={() => navigate('/movilidades?alerta=vencido')}
                />
            </div>

            {cargando ? (
                <Aviso>Cargando información...</Aviso>
            ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-xl border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <div className="flex items-center gap-2">
                                <CalendarClock className="size-4 text-primary" />
                                <h2 className="font-semibold">Monitoreo quincenal</h2>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {alertas.length} alerta(s)
                            </span>
                        </div>

                        <div className="divide-y divide-border">
                            {alertas.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    No hay monitoreos vencidos ni próximos a vencer.
                                </p>
                            ) : (
                                alertas.map((m) => (
                                    <Link
                                        key={m.id}
                                        to={`/movilidades/${m.id}`}
                                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {m.apellido_paterno} {m.apellido_materno}, {m.nombres}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {m.universidad_destino} · {m.ciudad_destino}, {m.pais_destino}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <AlertaMonitoreo proximo={m.proximo_monitoreo} compacto />
                                            {m.monitoreo_vencido && <AlertTriangle className="size-4 text-rose-500" />}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-xl border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <h2 className="font-semibold">Estado de las movilidades</h2>
                            <span className="text-xs text-muted-foreground">{movilidades.length} en total</span>
                        </div>
                        <div className="space-y-3 px-4 py-4">
                            {porEstado.map(({ estado, total }) => {
                                const porcentaje = movilidades.length > 0 ? (total / movilidades.length) * 100 : 0;
                                return (
                                    <div key={estado} className="flex items-center gap-3">
                                        <EstadoMovilidadBadge estado={estado} />
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${porcentaje}%` }} />
                                        </div>
                                        <span className="w-6 text-right text-sm font-medium">{total}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {porPais.length > 0 && (
                            <div className="border-t border-border px-4 py-4">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Países de destino</p>
                                <div className="flex flex-wrap gap-2">
                                    {porPais.map(([pais, total]) => (
                                        <span key={pais} className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs">
                                            {pais} <span className="ml-1 font-semibold">{total}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-border bg-card lg:col-span-2">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <h2 className="font-semibold">Expedientes por completar</h2>
                            <Link to="/movilidades?expediente=incompleto" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                Ver todas <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                        <div className="divide-y divide-border">
                            {pendientes.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    Todos los expedientes están completos.
                                </p>
                            ) : (
                                pendientes.map((m) => (
                                    <Link
                                        key={m.id}
                                        to={`/movilidades/${m.id}`}
                                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {m.apellido_paterno} {m.apellido_materno}, {m.nombres}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                DNI {m.dni} · {m.universidad_destino}
                                            </p>
                                        </div>
                                        <BarraProgreso valor={m.documentos_entregados} total={m.documentos_total} />
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
