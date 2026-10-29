import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, URL_EXPORT } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormularioMovilidad from '@/components/FormularioMovilidad';
import {
    Encabezado, Aviso, EstadoMovilidadBadge, BarraProgreso, AlertaMonitoreo, Vacio
} from '@/components/comunes';
import { Plane, Plus, Search, Pencil, FolderOpen, Download, AlertTriangle, FilterX } from 'lucide-react';
import { formatearFecha } from '@/lib/fechas';
import { ESTADOS_MOVILIDAD, FILTRO_TODOS } from '@/lib/catalogos';

const FORM_VACIO = {
    estudiante_id: '',
    facultad_origen: '',
    escuela_profesional: '',
    universidad_destino: '',
    facultad_destino: '',
    pais_destino: '',
    ciudad_destino: '',
    fecha_salida: '',
    fecha_retorno: '',
    direccion_residencia: '',
    postulado: false,
    estado: 'Postulando',
    observaciones: ''
};

function normalizarTexto(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function Movilidades() {
    const [movilidades, setMovilidades] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState(FILTRO_TODOS);
    const [soloIncompletos, setSoloIncompletos] = useState(false);
    const [soloVencidos, setSoloVencidos] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [searchParams] = useSearchParams();
    const estudiantePreseleccionado = useRef(searchParams.get('estudiante'));
    const navigate = useNavigate();

    useEffect(() => {
        if (searchParams.get('expediente') === 'incompleto') setSoloIncompletos(true);
        if (searchParams.get('alerta') === 'vencido') setSoloVencidos(true);
        // Solo se lee al montar la página.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargarDatos = async () => {
        try {
            const [resMovilidades, resEstudiantes] = await Promise.all([
                api.get('/movilidades'),
                api.get('/estudiantes')
            ]);

            if (resMovilidades.data.exito) setMovilidades(resMovilidades.data.datos);
            if (resEstudiantes.data.exito) {
                setEstudiantes(resEstudiantes.data.datos);

                const idPreseleccionado = estudiantePreseleccionado.current;
                if (idPreseleccionado) {
                    const encontrado = resEstudiantes.data.datos.find(
                        (estudiante) => String(estudiante.id) === String(idPreseleccionado) && !estudiante.movilidad_id
                    );
                    if (encontrado) {
                        setFormData({ ...FORM_VACIO, estudiante_id: String(encontrado.id) });
                        setEditando(null);
                        setModalAbierto(true);
                    }
                    estudiantePreseleccionado.current = null;
                }
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudieron cargar las movilidades.' });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const estudiantesDisponibles = useMemo(
        () => estudiantes.filter((estudiante) => !estudiante.movilidad_id),
        [estudiantes]
    );

    const filtradas = useMemo(() => {
        const termino = normalizarTexto(busqueda);

        return movilidades.filter((movilidad) => {
            if (filtroEstado !== FILTRO_TODOS && movilidad.estado !== filtroEstado) return false;
            if (soloIncompletos && movilidad.expediente_completo) return false;
            if (soloVencidos && !movilidad.monitoreo_vencido) return false;

            if (!termino) return true;

            const texto = normalizarTexto([
                movilidad.nombres,
                movilidad.apellido_paterno,
                movilidad.apellido_materno,
                movilidad.dni,
                movilidad.codigo_estudiante,
                movilidad.universidad_destino,
                movilidad.facultad_destino,
                movilidad.pais_destino,
                movilidad.ciudad_destino,
                movilidad.facultad_origen
            ].join(' '));

            return texto.includes(termino);
        });
    }, [movilidades, busqueda, filtroEstado, soloIncompletos, soloVencidos]);

    const totales = useMemo(() => ({
        vencidos: movilidades.filter((m) => m.monitoreo_vencido).length,
        incompletos: movilidades.filter((m) => !m.expediente_completo).length
    }), [movilidades]);

    const hayFiltros = busqueda || filtroEstado !== FILTRO_TODOS || soloIncompletos || soloVencidos;

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroEstado(FILTRO_TODOS);
        setSoloIncompletos(false);
        setSoloVencidos(false);
    };

    const abrirNueva = () => {
        setEditando(null);
        setFormData(FORM_VACIO);
        setMensaje(null);
        setModalAbierto(true);
    };

    const abrirEdicion = (movilidad) => {
        setEditando(movilidad);
        setFormData({
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
        setMensaje(null);
        setModalAbierto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.estudiante_id) {
            setMensaje({ tipo: 'error', texto: 'Debes seleccionar un estudiante.' });
            return;
        }

        if (!formData.fecha_salida || !formData.fecha_retorno) {
            setMensaje({ tipo: 'error', texto: 'Las fechas de salida y retorno son obligatorias.' });
            return;
        }

        if (formData.fecha_salida > formData.fecha_retorno) {
            setMensaje({ tipo: 'error', texto: 'La fecha de salida no puede ser posterior a la fecha de retorno.' });
            return;
        }

        try {
            setGuardando(true);
            let respuesta;

            if (editando) {
                const { estudiante_id: _estudianteId, ...cambios } = formData;
                respuesta = await api.patch(`/movilidades/${editando.id}`, cambios);
            } else {
                respuesta = await api.post('/movilidades', { ...formData, estudiante_id: Number(formData.estudiante_id) });
            }

            if (respuesta.data.exito) {
                setModalAbierto(false);
                setFormData(FORM_VACIO);
                setMensaje({
                    tipo: 'exito',
                    texto: editando
                        ? 'Movilidad actualizada correctamente.'
                        : 'Movilidad registrada. Se creó el checklist de 14 documentos.'
                });
                await cargarDatos();
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo guardar la movilidad.' });
        } finally {
            setGuardando(false);
        }
    };

    const estudiantesParaFormulario = editando
        ? estudiantes
        : estudiantesDisponibles;

    return (
        <div className="p-8 space-y-6">
            <Encabezado
                icono={Plane}
                titulo="Movilidades"
                descripcion="Registro y seguimiento de cada estudiante en el exterior."
            >
                <Button variant="outline" asChild>
                    <a href={URL_EXPORT} download>
                        <Download className="size-4" /> Exportar CSV
                    </a>
                </Button>
                <Button onClick={abrirNueva} disabled={estudiantesDisponibles.length === 0}>
                    <Plus className="size-4" /> Nueva movilidad
                </Button>
            </Encabezado>

            {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

            {estudiantes.length === 0 && (
                <Aviso tipo="aviso">
                    Todavía no hay estudiantes registrados. Primero regístralos en la sección Estudiantes para poder crear una movilidad.
                </Aviso>
            )}

            {estudiantesDisponibles.length === 0 && estudiantes.length > 0 && (
                <Aviso tipo="aviso">
                    Todos los estudiantes registrados ya tienen una movilidad. Recuerda que el sistema permite una sola movilidad por estudiante.
                </Aviso>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por estudiante, universidad, país..."
                        className="pl-8"
                    />
                </div>

                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={FILTRO_TODOS}>Todos los estados</SelectItem>
                        {ESTADOS_MOVILIDAD.map((estado) => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant={soloIncompletos ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSoloIncompletos((v) => !v)}
                >
                    Expediente incompleto ({totales.incompletos})
                </Button>

                <Button
                    variant={soloVencidos ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setSoloVencidos((v) => !v)}
                >
                    <AlertTriangle className="size-3.5" />
                    Monitoreo vencido ({totales.vencidos})
                </Button>

                {hayFiltros && (
                    <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                        <FilterX className="size-3.5" /> Limpiar
                    </Button>
                )}

                <span className="ml-auto text-sm text-muted-foreground">
                    {filtradas.length} de {movilidades.length} movilidad(es)
                </span>
            </div>

            <div className="rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead>Expediente</TableHead>
                            <TableHead>Monitoreo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cargando ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Cargando información...</TableCell>
                            </TableRow>
                        ) : filtradas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <Vacio mensaje={movilidades.length === 0 ? 'No hay movilidades registradas.' : 'Ninguna movilidad coincide con los filtros.'} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtradas.map((movilidad) => (
                                <TableRow key={movilidad.id}>
                                    <TableCell>
                                        <p className="font-medium">
                                            {movilidad.apellido_paterno} {movilidad.apellido_materno}, {movilidad.nombres}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            DNI {movilidad.dni} · {movilidad.codigo_estudiante}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{movilidad.universidad_destino}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {movilidad.ciudad_destino}, {movilidad.pais_destino}
                                        </p>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-xs">
                                        <p>Salida: {formatearFecha(movilidad.fecha_salida)}</p>
                                        <p className="text-muted-foreground">Retorno: {formatearFecha(movilidad.fecha_retorno)}</p>
                                    </TableCell>
                                    <TableCell>
                                        <BarraProgreso
                                            valor={Number(movilidad.documentos_entregados || 0)}
                                            total={Number(movilidad.documentos_total || 0)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <AlertaMonitoreo
                                            proximo={movilidad.proximo_monitoreo}
                                            vencido={movilidad.monitoreo_vencido}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <EstadoMovilidadBadge estado={movilidad.estado} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" title="Editar movilidad" onClick={() => abrirEdicion(movilidad)}>
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => navigate(`/movilidades/${movilidad.id}`)}>
                                                <FolderOpen className="size-3.5" /> Expediente
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editando ? 'Editar movilidad' : 'Registrar nueva movilidad'}</DialogTitle>
                        <DialogDescription>
                            {editando
                                ? 'El estudiante no se puede cambiar: una movilidad por estudiante.'
                                : 'Al guardar se crearán automáticamente los 14 documentos del expediente en estado Pendiente.'}
                        </DialogDescription>
                    </DialogHeader>

                    {estudiantesParaFormulario.length === 0 ? (
                        <Aviso tipo="aviso">
                            No hay estudiantes disponibles sin movilidad. Registra primero al estudiante en la sección Estudiantes.
                        </Aviso>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                            <FormularioMovilidad
                                valor={formData}
                                onChange={setFormData}
                                estudiantes={estudiantesParaFormulario}
                                bloquearEstudiante={Boolean(editando)}
                            />

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={guardando}>
                                    {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar movilidad'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
