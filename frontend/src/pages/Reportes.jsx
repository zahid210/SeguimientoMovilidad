import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, URL_EXPORT } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Encabezado, Aviso, Vacio, BarraProgreso, EstadoMovilidadBadge, AlertaMonitoreo
} from '@/components/comunes';
import { FileText, Download, AlertTriangle, FolderCheck, FolderClock } from 'lucide-react';
import { ESTADOS_MOVILIDAD } from '@/lib/catalogos';

function agrupar(lista, obtenerClave) {
    const mapa = new Map();
    for (const elemento of lista) {
        const clave = obtenerClave(elemento) || 'Sin dato';
        if (!mapa.has(clave)) {
            mapa.set(clave, { clave, total: 0, completos: 0, vencidos: 0 });
        }
        const grupo = mapa.get(clave);
        grupo.total += 1;
        if (elemento.expediente_completo) grupo.completos += 1;
        if (elemento.monitoreo_vencido) grupo.vencidos += 1;
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
}

export default function Reportes() {
    const [movilidades, setMovilidades] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let activo = true;

        (async () => {
            try {
                const respuesta = await api.get('/movilidades');
                if (activo && respuesta.data.exito) setMovilidades(respuesta.data.datos);
            } catch (err) {
                if (activo) setError(err.response?.data?.mensaje || 'No se pudieron cargar los reportes.');
            } finally {
                if (activo) setCargando(false);
            }
        })();

        return () => { activo = false; };
    }, []);

    const resumen = useMemo(() => {
        const completos = movilidades.filter((m) => m.expediente_completo);
        const incompletos = movilidades.filter((m) => !m.expediente_completo);
        const vencidos = movilidades.filter((m) => m.monitoreo_vencido);
        const cobertura = movilidades.length > 0 ? Math.round((completos.length / movilidades.length) * 100) : 0;

        return {
            completos,
            incompletos,
            vencidos,
            cobertura,
            porEstado: ESTADOS_MOVILIDAD.map((estado) => ({
                estado,
                total: movilidades.filter((m) => m.estado === estado).length
            })),
            porPais: agrupar(movilidades, (m) => m.pais_destino),
            porFacultad: agrupar(movilidades, (m) => m.facultad_origen),
            incompletosOrdenados: [...incompletos].sort(
                (a, b) => (b.documentos_total - b.documentos_entregados) - (a.documentos_total - a.documentos_entregados)
            ),
            vencidosOrdenados: [...vencidos].sort(
                (a, b) => String(a.proximo_monitoreo).localeCompare(String(b.proximo_monitoreo))
            )
        };
    }, [movilidades]);

    return (
        <div className="p-8 space-y-6">
            <Encabezado
                icono={FileText}
                titulo="Reportes"
                descripcion="Indicadores de expedientes, destinos y monitoreo quincenal."
            >
                <Button asChild>
                    <a href={URL_EXPORT} download>
                        <Download className="size-4" /> Exportar todo a CSV
                    </a>
                </Button>
            </Encabezado>

            {error && <Aviso tipo="error">{error}</Aviso>}

            {cargando ? (
                <Aviso>Cargando reportes...</Aviso>
            ) : movilidades.length === 0 ? (
                <div className="rounded-xl border border-border bg-card">
                    <Vacio mensaje="Aún no hay movilidades registradas para generar reportes." />
                </div>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cobertura de expedientes</p>
                                <FolderCheck className="size-4 text-emerald-600" />
                            </div>
                            <p className="mt-2 text-2xl font-bold text-emerald-600">{resumen.cobertura}%</p>
                            <p className="mt-1 text-xs text-muted-foreground">{resumen.completos.length} de {movilidades.length} completos</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expedientes incompletos</p>
                                <FolderClock className="size-4 text-amber-600" />
                            </div>
                            <p className="mt-2 text-2xl font-bold text-amber-600">{resumen.incompletos.length}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Con al menos un documento pendiente</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Monitoreos vencidos</p>
                                <AlertTriangle className="size-4 text-rose-600" />
                            </div>
                            <p className="mt-2 text-2xl font-bold text-rose-600">{resumen.vencidos.length}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Requieren contacto inmediato</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Movilidades activas</p>
                                <FolderCheck className="size-4" />
                            </div>
                            <p className="mt-2 text-2xl font-bold">
                                {movilidades.filter((m) => m.estado === 'En Extranjero').length}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">Estudiantes actualmente en el exterior</p>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-xl border border-border bg-card">
                            <div className="border-b border-border px-4 py-3">
                                <h2 className="font-semibold">Movilidades por estado</h2>
                            </div>
                            <div className="space-y-3 px-4 py-4">
                                {resumen.porEstado.map(({ estado, total }) => (
                                    <div key={estado} className="flex items-center gap-3">
                                        <EstadoMovilidadBadge estado={estado} />
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary/60"
                                                style={{ width: `${movilidades.length > 0 ? (total / movilidades.length) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-sm font-medium">{total}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-xl border border-border bg-card">
                            <div className="border-b border-border px-4 py-3">
                                <h2 className="font-semibold">Destinos por país</h2>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>País</TableHead>
                                        <TableHead className="text-right">Movilidades</TableHead>
                                        <TableHead className="text-right">Expedientes completos</TableHead>
                                        <TableHead className="text-right">Monitoreo vencido</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resumen.porPais.map((grupo) => (
                                        <TableRow key={grupo.clave}>
                                            <TableCell className="font-medium">{grupo.clave}</TableCell>
                                            <TableCell className="text-right">{grupo.total}</TableCell>
                                            <TableCell className="text-right">{grupo.completos}</TableCell>
                                            <TableCell className={`text-right ${grupo.vencidos > 0 ? 'font-semibold text-rose-600' : ''}`}>
                                                {grupo.vencidos}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </section>

                        <section className="rounded-xl border border-border bg-card lg:col-span-2">
                            <div className="border-b border-border px-4 py-3">
                                <h2 className="font-semibold">Expedientes incompletos</h2>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Estudiante</TableHead>
                                        <TableHead>Destino</TableHead>
                                        <TableHead>Progreso</TableHead>
                                        <TableHead>Documentos pendientes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resumen.incompletosOrdenados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4}><Vacio mensaje="Todos los expedientes están completos." /></TableCell>
                                        </TableRow>
                                    ) : (
                                        resumen.incompletosOrdenados.map((movilidad) => (
                                            <TableRow key={movilidad.id}>
                                                <TableCell>
                                                    <Link to={`/movilidades/${movilidad.id}`} className="font-medium hover:underline">
                                                        {movilidad.apellido_paterno} {movilidad.apellido_materno}, {movilidad.nombres}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground">DNI {movilidad.dni}</div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {movilidad.universidad_destino}
                                                    <div className="text-xs text-muted-foreground">{movilidad.pais_destino}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <BarraProgreso valor={movilidad.documentos_entregados} total={movilidad.documentos_total} />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {movilidad.documentos_total - movilidad.documentos_entregados}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </section>

                        <section className="rounded-xl border border-border bg-card lg:col-span-2">
                            <div className="border-b border-border px-4 py-3">
                                <h2 className="font-semibold">Monitoreos vencidos</h2>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Estudiante</TableHead>
                                        <TableHead>Destino</TableHead>
                                        <TableHead>Último monitoreo</TableHead>
                                        <TableHead>Próximo contacto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resumen.vencidosOrdenados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4}><Vacio mensaje="No hay monitoreos vencidos." /></TableCell>
                                        </TableRow>
                                    ) : (
                                        resumen.vencidosOrdenados.map((movilidad) => (
                                            <TableRow key={movilidad.id}>
                                                <TableCell>
                                                    <Link to={`/movilidades/${movilidad.id}`} className="font-medium hover:underline">
                                                        {movilidad.apellido_paterno} {movilidad.apellido_materno}, {movilidad.nombres}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground">DNI {movilidad.dni}</div>
                                                </TableCell>
                                                <TableCell className="text-sm">{movilidad.universidad_destino}</TableCell>
                                                <TableCell className="text-sm">{movilidad.ultimo_monitoreo || 'Sin monitoreos'}</TableCell>
                                                <TableCell>
                                                    <AlertaMonitoreo proximo={movilidad.proximo_monitoreo} compacto />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </section>

                        <section className="rounded-xl border border-border bg-card lg:col-span-2">
                            <div className="border-b border-border px-4 py-3">
                                <h2 className="font-semibold">Movilidades por facultad de origen</h2>
                            </div>
                            <div className="divide-y divide-border">
                                {resumen.porFacultad.map((grupo) => (
                                    <div key={grupo.clave} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                        <p className="text-sm font-medium">{grupo.clave}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{grupo.total} movilidad(es)</span>
                                            <span>{grupo.completos} expediente(s) completo(s)</span>
                                            <span className={grupo.vencidos > 0 ? 'font-semibold text-rose-600' : ''}>
                                                {grupo.vencidos} vencido(s)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
