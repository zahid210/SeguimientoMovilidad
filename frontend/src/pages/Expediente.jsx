import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, urlArchivo, URL_EXPORT } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import FormularioMovilidad from '@/components/FormularioMovilidad';
import {
    Aviso, EstadoMovilidadBadge, EstadoMonitoreoBadge, ChipExpediente,
    BarraProgreso, Vacio, Dato
} from '@/components/comunes';
import {
    ArrowLeft, FileText, Activity, Upload, Eye, Trash2, Pencil, Download,
    CalendarClock, CheckCircle2, Clock3, MessageSquare, AlertTriangle
} from 'lucide-react';
import { formatearFecha, formatearFechaHora, hoyISO, sumarDiasISO, estadoMonitoreo } from '@/lib/fechas';
import { ESTADOS_MOVILIDAD, ESTADOS_MONITOREO, MEDIOS_CONTACTO, etiquetaSemestre } from '@/lib/catalogos';

function monitoreoVacio() {
    return {
        fecha_registro: hoyISO(),
        estado_estudiante: 'Sin novedades',
        medio_contacto: 'WhatsApp',
        responsable: '',
        proxima_fecha: '',
        observaciones: ''
    };
}

function TarjetaResumen({ icono: Icono, etiqueta, valor, detalle, tono = 'neutro' }) {
    const tonos = {
        neutro: 'text-foreground',
        ok: 'text-emerald-600',
        alerta: 'text-amber-600',
        peligro: 'text-rose-600'
    };

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
                <Icono className={`size-4 ${tonos[tono]}`} />
            </div>
            <p className={`mt-2 text-xl font-bold ${tonos[tono]}`}>{valor}</p>
            {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
        </div>
    );
}

export default function Expediente() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [movilidad, setMovilidad] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [resumenDocs, setResumenDocs] = useState({ total: 0, entregados: 0, pendientes: 0, completo: false });
    const [monitoreos, setMonitoreos] = useState([]);
    const [resumenMonitoreo, setResumenMonitoreo] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState(null);

    const [subiendoTipo, setSubiendoTipo] = useState(null);
    const [dialogoDatos, setDialogoDatos] = useState(false);
    const [formDatos, setFormDatos] = useState(null);
    const [guardandoDatos, setGuardandoDatos] = useState(false);
    const [cambiandoEstado, setCambiandoEstado] = useState(false);

    const [formMonitoreo, setFormMonitoreo] = useState(monitoreoVacio);
    const [guardandoMonitoreo, setGuardandoMonitoreo] = useState(false);

    const cargarDatos = async () => {
        try {
            const [resMovilidad, resDocumentos, resMonitoreos] = await Promise.all([
                api.get(`/movilidades/${id}`),
                api.get(`/documentos/${id}`),
                api.get(`/monitoreos/${id}`)
            ]);

            if (resMovilidad.data.exito) setMovilidad(resMovilidad.data.datos);
            if (resDocumentos.data.exito) {
                setDocumentos(resDocumentos.data.datos);
                setResumenDocs(resDocumentos.data.resumen);
            }
            if (resMonitoreos.data.exito) {
                setMonitoreos(resMonitoreos.data.datos);
                setResumenMonitoreo(resMonitoreos.data.resumen);
            }
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.status === 404
                    ? 'La movilidad no existe o fue eliminada.'
                    : error.response?.data?.mensaje || 'No se pudo cargar el expediente.'
            });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        setCargando(true);
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const proximaCalculada = useMemo(
        () => formMonitoreo.fecha_registro ? sumarDiasISO(formMonitoreo.fecha_registro, 15) : '',
        [formMonitoreo.fecha_registro]
    );

    const estadoProximo = estadoMonitoreo(resumenMonitoreo?.proximo_monitoreo);

    const handleEstado = async (nuevoEstado) => {
        try {
            setCambiandoEstado(true);
            const respuesta = await api.patch(`/movilidades/${id}`, { estado: nuevoEstado });
            if (respuesta.data.exito) {
                setMovilidad(respuesta.data.datos);
                setMensaje({ tipo: 'exito', texto: 'Estado de la movilidad actualizado.' });
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo cambiar el estado.' });
        } finally {
            setCambiandoEstado(false);
        }
    };

    const abrirEdicionDatos = () => {
        setFormDatos({
            estudiante_id: String(movilidad.estudiante_id),
            facultad_origen: movilidad.facultad_origen || '',
            escuela_profesional: movilidad.escuela_profesional || '',
            universidad_destino: movilidad.universidad_destino || '',
            facultad_destino: movilidad.facultad_destino || '',
            pais_destino: movilidad.pais_destino || '',
            ciudad_destino: movilidad.ciudad_destino || '',
            fecha_salida: String(movilidad.fecha_salida || '').slice(0, 10),
            fecha_retorno: String(movilidad.fecha_retorno || '').slice(0, 10),
            direccion_residencia: movilidad.direccion_residencia || '',
            postulado: Boolean(movilidad.postulado),
            estado: movilidad.estado,
            observaciones: movilidad.observaciones || ''
        });
        setDialogoDatos(true);
    };

    const guardarDatos = async (e) => {
        e.preventDefault();

        if (formDatos.fecha_salida > formDatos.fecha_retorno) {
            setMensaje({ tipo: 'error', texto: 'La fecha de salida no puede ser posterior a la fecha de retorno.' });
            return;
        }

        try {
            setGuardandoDatos(true);
            const { estudiante_id: _estudianteId, ...cambios } = formDatos;
            const respuesta = await api.patch(`/movilidades/${id}`, cambios);

            if (respuesta.data.exito) {
                setMovilidad(respuesta.data.datos);
                setDialogoDatos(false);
                setMensaje({ tipo: 'exito', texto: 'Datos de la movilidad actualizados.' });
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudieron guardar los cambios.' });
        } finally {
            setGuardandoDatos(false);
        }
    };

    const subirDocumento = async (documento, archivo) => {
        if (!archivo) return;

        if (archivo.type !== 'application/pdf') {
            setMensaje({ tipo: 'error', texto: 'Solo se permiten archivos PDF.' });
            return;
        }

        try {
            setSubiendoTipo(documento.tipo_documento);
            const datos = new FormData();
            datos.append('movilidad_id', id);
            datos.append('tipo_documento', documento.tipo_documento);
            datos.append('archivo', archivo);

            const respuesta = await api.post('/documentos', datos);
            if (respuesta.data.exito) {
                setMensaje({ tipo: 'exito', texto: `"${documento.nombre}" marcado como Entregado.` });
                await cargarDatos();
            }
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje || 'No se pudo subir el documento.'
            });
        } finally {
            setSubiendoTipo(null);
        }
    };

    const quitarDocumento = async (documento) => {
        if (!window.confirm(`¿Quitar "${documento.nombre}"? El documento volverá a estado Pendiente.`)) return;

        try {
            const respuesta = await api.delete(`/documentos/${id}/${documento.tipo_documento}`);
            if (respuesta.data.exito) {
                setMensaje({ tipo: 'aviso', texto: `"${documento.nombre}" quedó Pendiente.` });
                await cargarDatos();
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo quitar el documento.' });
        }
    };

    const registrarMonitoreo = async (e) => {
        e.preventDefault();

        try {
            setGuardandoMonitoreo(true);
            const respuesta = await api.post('/monitoreos', {
                movilidad_id: id,
                ...formMonitoreo,
                proxima_fecha: formMonitoreo.proxima_fecha || undefined
            });

            if (respuesta.data.exito) {
                setMensaje({
                    tipo: 'exito',
                    texto: `Monitoreo registrado. Próximo contacto: ${formatearFecha(respuesta.data.proxima_fecha)}.`
                });
                setFormMonitoreo({ ...monitoreoVacio(), responsable: formMonitoreo.responsable });
                await cargarDatos();
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo registrar el monitoreo.' });
        } finally {
            setGuardandoMonitoreo(false);
        }
    };

    const eliminarMonitoreo = async (monitoreo) => {
        if (!window.confirm(`¿Eliminar el monitoreo del ${formatearFecha(monitoreo.fecha_registro)}?`)) return;

        try {
            const respuesta = await api.delete(`/monitoreos/${id}/${monitoreo.id}`);
            if (respuesta.data.exito) {
                setMensaje({ tipo: 'aviso', texto: 'Monitoreo eliminado.' });
                await cargarDatos();
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo eliminar el monitoreo.' });
        }
    };

    if (cargando) {
        return <div className="p-8"><Aviso>Cargando expediente...</Aviso></div>;
    }

    if (!movilidad) {
        return (
            <div className="p-8 space-y-4">
                <Aviso tipo="error">{mensaje?.texto || 'No se encontró la movilidad.'}</Aviso>
                <Button variant="outline" onClick={() => navigate('/movilidades')}>
                    <ArrowLeft className="size-4" /> Volver a movilidades
                </Button>
            </div>
        );
    }

    const estudianteParaFormulario = [{
        id: movilidad.estudiante_id,
        dni: movilidad.dni,
        nombres: movilidad.nombres,
        apellido_paterno: movilidad.apellido_paterno,
        apellido_materno: movilidad.apellido_materno
    }];

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button variant="outline" size="icon" onClick={() => navigate('/movilidades')} title="Volver">
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {movilidad.apellido_paterno} {movilidad.apellido_materno}, {movilidad.nombres}
                            </h1>
                            <EstadoMovilidadBadge estado={movilidad.estado} />
                            <ChipExpediente
                                entregados={resumenDocs.entregados}
                                total={resumenDocs.total}
                                completo={resumenDocs.completo}
                            />
                        </div>
                        <p className="text-muted-foreground">
                            DNI {movilidad.dni}
                            {movilidad.semestre ? ` · ${etiquetaSemestre(movilidad.semestre)}` : ''}
                            {' · '}{movilidad.codigo_estudiante} · {movilidad.correo_institucional}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select value={movilidad.estado} onValueChange={handleEstado} disabled={cambiandoEstado}>
                        <SelectTrigger className="w-[190px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {ESTADOS_MOVILIDAD.map((estado) => (
                                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={abrirEdicionDatos}>
                        <Pencil className="size-4" /> Editar datos
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={URL_EXPORT} download>
                            <Download className="size-4" /> CSV
                        </a>
                    </Button>
                </div>
            </div>

            {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                    icono={CheckCircle2}
                    etiqueta="Documentos entregados"
                    valor={`${resumenDocs.entregados}/${resumenDocs.total}`}
                    detalle={resumenDocs.completo ? 'Expediente completo' : `${resumenDocs.pendientes} pendiente(s)`}
                    tono={resumenDocs.completo ? 'ok' : 'alerta'}
                />
                <TarjetaResumen
                    icono={CalendarClock}
                    etiqueta="último monitoreo"
                    valor={formatearFecha(resumenMonitoreo?.ultimo_monitoreo)}
                    detalle={`${resumenMonitoreo?.monitoreos_realizados || 0} monitoreo(s) realizados`}
                />
                <TarjetaResumen
                    icono={Clock3}
                    etiqueta="Próximo monitoreo"
                    valor={formatearFecha(resumenMonitoreo?.proximo_monitoreo)}
                    detalle={estadoProximo.texto}
                    tono={resumenMonitoreo?.monitoreo_vencido ? 'peligro' : estadoProximo.tono === 'ok' ? 'ok' : 'alerta'}
                />
                <TarjetaResumen
                    icono={AlertTriangle}
                    etiqueta="Alerta"
                    valor={resumenMonitoreo?.monitoreo_vencido ? 'Vencido' : 'Al día'}
                    detalle="Frecuencia quincenal (15 días)"
                    tono={resumenMonitoreo?.monitoreo_vencido ? 'peligro' : 'ok'}
                />
            </div>

            <section className="rounded-xl border border-border bg-card p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">Datos de la movilidad</h2>
                    <div className="w-full max-w-xs">
                        <BarraProgreso valor={resumenDocs.entregados} total={resumenDocs.total} className="justify-end" />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Dato etiqueta="Universidad destino" valor={movilidad.universidad_destino} />
                    <Dato etiqueta="Facultad destino" valor={movilidad.facultad_destino} />
                    <Dato etiqueta="Ciudad / País" valor={`${movilidad.ciudad_destino}, ${movilidad.pais_destino}`} />
                    <Dato etiqueta="Facultad origen" valor={movilidad.facultad_origen} />
                    <Dato etiqueta="Escuela profesional" valor={movilidad.escuela_profesional} />
                    <Dato etiqueta="Postulado" valor={movilidad.postulado ? 'SÍ' : 'NO'} />
                    <Dato etiqueta="Fecha de salida" valor={formatearFecha(movilidad.fecha_salida)} />
                    <Dato etiqueta="Fecha de retorno" valor={formatearFecha(movilidad.fecha_retorno)} />
                    <Dato etiqueta="WhatsApp" valor={movilidad.telefono_whatsapp} />
                    <Dato etiqueta="Contacto de emergencia" valor={movilidad.contacto_emergencia} />
                    <Dato etiqueta="Correo personal" valor={movilidad.correo_personal} />
                    <Dato etiqueta="Dirección de residencia en el extranjero" valor={movilidad.direccion_residencia} className="lg:col-span-2" />
                </div>

                {movilidad.observaciones && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observaciones</p>
                        <p className="mt-1 whitespace-pre-line text-sm">{movilidad.observaciones}</p>
                    </div>
                )}
            </section>

            <Tabs defaultValue="documentos" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="documentos" className="gap-2">
                        <FileText className="size-4" /> Documentos ({resumenDocs.entregados}/{resumenDocs.total})
                    </TabsTrigger>
                    <TabsTrigger value="monitoreos" className="gap-2">
                        <Activity className="size-4" /> Monitoreo ({monitoreos.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="documentos" className="mt-6 space-y-4">
                    <Aviso tipo="info">
                        Cada documento se marca como <strong>Entregado</strong> al adjuntar su PDF. El expediente se considera completo cuando los 14 documentos están entregados.
                    </Aviso>

                    <div className="rounded-lg border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha de entrega</TableHead>
                                    <TableHead>Archivo</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documentos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6}><Vacio mensaje="No hay documentos en el checklist." /></TableCell>
                                    </TableRow>
                                ) : (
                                    documentos.map((documento) => {
                                        const entregado = documento.estado_entrega === 'Entregado';
                                        const inputId = `archivo-${documento.tipo_documento}`;
                                        const subiendo = subiendoTipo === documento.tipo_documento;

                                        return (
                                            <TableRow key={documento.tipo_documento}>
                                                <TableCell className="text-muted-foreground">{documento.orden}</TableCell>
                                                <TableCell className="font-medium">{documento.nombre}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                                        entregado
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {entregado ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
                                                        {documento.estado_entrega}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-sm">
                                                    {formatearFecha(documento.fecha_entrega)}
                                                </TableCell>
                                                <TableCell>
                                                    {documento.ruta_archivo ? (
                                                        <a
                                                            href={urlArchivo(documento.ruta_archivo)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                        >
                                                            <Eye className="size-3.5" /> Ver PDF
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Sin archivo</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <input
                                                            id={inputId}
                                                            type="file"
                                                            accept="application/pdf"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                subirDocumento(documento, e.target.files?.[0]);
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                        <Button variant={entregado ? 'outline' : 'default'} size="sm" asChild>
                                                            <label htmlFor={inputId} className="cursor-pointer">
                                                                <Upload className="size-3.5" />
                                                                {subiendo ? 'Subiendo...' : entregado ? 'Reemplazar' : 'Adjuntar PDF'}
                                                            </label>
                                                        </Button>
                                                        {entregado && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                title="Quitar documento"
                                                                onClick={() => quitarDocumento(documento)}
                                                            >
                                                                <Trash2 className="size-3.5 text-destructive" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="monitoreos" className="mt-6 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <TarjetaResumen
                            icono={MessageSquare}
                            etiqueta="Último contacto"
                            valor={formatearFecha(resumenMonitoreo?.ultimo_monitoreo)}
                            detalle={monitoreos[0]?.medio_contacto || 'Sin registro'}
                        />
                        <TarjetaResumen
                            icono={CalendarClock}
                            etiqueta="Próximo contacto"
                            valor={formatearFecha(resumenMonitoreo?.proximo_monitoreo)}
                            detalle={estadoProximo.texto}
                            tono={resumenMonitoreo?.monitoreo_vencido ? 'peligro' : 'ok'}
                        />
                        <TarjetaResumen
                            icono={Activity}
                            etiqueta="Monitoreos realizados"
                            valor={resumenMonitoreo?.monitoreos_realizados || 0}
                            detalle="Frecuencia cada 15 días"
                        />
                        <TarjetaResumen
                            icono={AlertTriangle}
                            etiqueta="Situación"
                            valor={resumenMonitoreo?.monitoreo_vencido ? 'Vencido' : 'Al día'}
                            detalle={resumenMonitoreo?.monitoreo_vencido ? 'Registrar el monitoreo pendiente' : 'Sin alertas'}
                            tono={resumenMonitoreo?.monitoreo_vencido ? 'peligro' : 'ok'}
                        />
                    </div>

                    <div className="rounded-lg border border-border bg-card p-6">
                        <h3 className="mb-4 font-semibold">Registrar monitoreo</h3>
                        <form onSubmit={registrarMonitoreo} className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="fecha_registro">Fecha del contacto *</Label>
                                <Input
                                    id="fecha_registro"
                                    type="date"
                                    required
                                    value={formMonitoreo.fecha_registro}
                                    onChange={(e) => setFormMonitoreo({ ...formMonitoreo, fecha_registro: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estado_estudiante">Estado del estudiante *</Label>
                                <Select
                                    value={formMonitoreo.estado_estudiante}
                                    onValueChange={(valor) => setFormMonitoreo({ ...formMonitoreo, estado_estudiante: valor })}
                                >
                                    <SelectTrigger id="estado_estudiante" className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS_MONITOREO.map((estado) => (
                                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="medio_contacto">Medio de contacto</Label>
                                <Select
                                    value={formMonitoreo.medio_contacto}
                                    onValueChange={(valor) => setFormMonitoreo({ ...formMonitoreo, medio_contacto: valor })}
                                >
                                    <SelectTrigger id="medio_contacto" className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {MEDIOS_CONTACTO.map((medio) => (
                                            <SelectItem key={medio} value={medio}>{medio}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="responsable">Responsable del monitoreo</Label>
                                <Input
                                    id="responsable"
                                    placeholder="Ej: Annet"
                                    value={formMonitoreo.responsable}
                                    onChange={(e) => setFormMonitoreo({ ...formMonitoreo, responsable: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="proxima_fecha">Próximo contacto (opcional)</Label>
                                <Input
                                    id="proxima_fecha"
                                    type="date"
                                    value={formMonitoreo.proxima_fecha}
                                    onChange={(e) => setFormMonitoreo({ ...formMonitoreo, proxima_fecha: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Si se deja vacío se programa automáticamente: {formatearFecha(proximaCalculada)}.
                                </p>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <Textarea
                                    id="observaciones"
                                    className="resize-none"
                                    placeholder="Detalles del seguimiento quincenal..."
                                    value={formMonitoreo.observaciones}
                                    onChange={(e) => setFormMonitoreo({ ...formMonitoreo, observaciones: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end sm:col-span-2">
                                <Button type="submit" disabled={guardandoMonitoreo}>
                                    <MessageSquare className="size-4" />
                                    {guardandoMonitoreo ? 'Guardando...' : 'Guardar monitoreo'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-lg border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Medio / responsable</TableHead>
                                    <TableHead>Próximo contacto</TableHead>
                                    <TableHead>Observaciones</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monitoreos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6}><Vacio mensaje="Aún no hay monitoreos registrados para esta movilidad." /></TableCell>
                                    </TableRow>
                                ) : (
                                    monitoreos.map((monitoreo) => (
                                        <TableRow key={monitoreo.id}>
                                            <TableCell className="whitespace-nowrap font-medium">
                                                {formatearFecha(monitoreo.fecha_registro)}
                                                <div className="text-xs font-normal text-muted-foreground">
                                                    {formatearFechaHora(monitoreo.fecha_creacion)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <EstadoMonitoreoBadge estado={monitoreo.estado_estudiante} />
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <p>{monitoreo.medio_contacto || '—'}</p>
                                                <p className="text-muted-foreground">{monitoreo.responsable || 'Sin responsable'}</p>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm">
                                                {formatearFecha(monitoreo.proxima_fecha)}
                                            </TableCell>
                                            <TableCell className="max-w-[280px] whitespace-normal text-sm text-muted-foreground">
                                                {monitoreo.observaciones || '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    title="Eliminar monitoreo"
                                                    onClick={() => eliminarMonitoreo(monitoreo)}
                                                >
                                                    <Trash2 className="size-3.5 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={dialogoDatos} onOpenChange={setDialogoDatos}>
                <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar datos de la movilidad</DialogTitle>
                        <DialogDescription>
                            El estudiante no se puede cambiar. Los documentos del expediente se mantienen.
                        </DialogDescription>
                    </DialogHeader>

                    {formDatos && (
                        <form onSubmit={guardarDatos} className="mt-2 space-y-4">
                            <FormularioMovilidad
                                valor={formDatos}
                                onChange={setFormDatos}
                                estudiantes={estudianteParaFormulario}
                                bloquearEstudiante
                            />
                            <div className="flex justify-end gap-3 border-t pt-4">
                                <Button type="button" variant="outline" onClick={() => setDialogoDatos(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={guardandoDatos}>
                                    {guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
