import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Encabezado, Aviso, EstadoMovilidadBadge, BarraProgreso, Vacio } from '@/components/comunes';
import { Users, Plus, Search, Pencil, Plane, FolderOpen } from 'lucide-react';
import { SEMESTRES, etiquetaSemestre } from '@/lib/catalogos';

const FORM_VACIO = {
    dni: '',
    codigo_estudiante: '',
    semestre: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo_personal: '',
    correo_institucional: '',
    telefono_whatsapp: '',
    contacto_emergencia: ''
};

function normalizarTexto(valor) {
    return String(valor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function Estudiantes() {
    const [estudiantes, setEstudiantes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const navigate = useNavigate();

    const cargarEstudiantes = async () => {
        try {
            const respuesta = await api.get('/estudiantes');
            if (respuesta.data.exito) setEstudiantes(respuesta.data.datos);
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo cargar el padrón.' });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activo = true;

        (async () => {
            try {
                const respuesta = await api.get('/estudiantes');
                if (activo && respuesta.data.exito) setEstudiantes(respuesta.data.datos);
            } catch (error) {
                if (activo) {
                    setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo cargar el padrón.' });
                }
            } finally {
                if (activo) setCargando(false);
            }
        })();

        return () => { activo = false; };
    }, []);

    const filtrados = useMemo(() => {
        const termino = normalizarTexto(busqueda);
        if (!termino) return estudiantes;

        return estudiantes.filter((estudiante) => {
            const texto = normalizarTexto([
                estudiante.nombres,
                estudiante.apellido_paterno,
                estudiante.apellido_materno,
                estudiante.dni,
                estudiante.codigo_estudiante,
                estudiante.semestre,
                estudiante.correo_personal,
                estudiante.correo_institucional
            ].join(' '));
            return texto.includes(termino);
        });
    }, [estudiantes, busqueda]);

    const abrirNuevo = () => {
        setEditandoId(null);
        setFormData(FORM_VACIO);
        setMensaje(null);
        setModalAbierto(true);
    };

    const abrirEdicion = (estudiante) => {
        setEditandoId(estudiante.id);
        setFormData({
            dni: estudiante.dni || '',
            codigo_estudiante: estudiante.codigo_estudiante || '',
            semestre: estudiante.semestre ? String(estudiante.semestre) : '',
            nombres: estudiante.nombres || '',
            apellido_paterno: estudiante.apellido_paterno || '',
            apellido_materno: estudiante.apellido_materno || '',
            correo_personal: estudiante.correo_personal || '',
            correo_institucional: estudiante.correo_institucional || '',
            telefono_whatsapp: estudiante.telefono_whatsapp || '',
            contacto_emergencia: estudiante.contacto_emergencia || ''
        });
        setMensaje(null);
        setModalAbierto(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!/^\d{8}$/.test(formData.dni.trim())) {
            setMensaje({ tipo: 'error', texto: 'El DNI debe tener exactamente 8 dígitos.' });
            return;
        }

        if (!formData.semestre) {
            setMensaje({ tipo: 'error', texto: 'Debes seleccionar el semestre del estudiante.' });
            return;
        }

        try {
            setGuardando(true);
            const respuesta = editandoId
                ? await api.put(`/estudiantes/${editandoId}`, formData)
                : await api.post('/estudiantes', formData);

            if (respuesta.data.exito) {
                setModalAbierto(false);
                setFormData(FORM_VACIO);
                setMensaje({
                    tipo: 'exito',
                    texto: editandoId ? 'Estudiante actualizado correctamente.' : 'Estudiante registrado correctamente.'
                });
                await cargarEstudiantes();
            }
        } catch (error) {
            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje || 'No se pudo guardar el estudiante.'
            });
        } finally {
            setGuardando(false);
        }
    };

    const sinMovilidad = estudiantes.filter((e) => !e.movilidad_id).length;

    return (
        <div className="p-8 space-y-6">
            <Encabezado
                icono={Users}
                titulo="Estudiantes"
                descripcion="Padrón de alumnos en proceso de movilidad. Cada estudiante puede tener una sola movilidad."
            >
                <Button onClick={abrirNuevo}>
                    <Plus className="size-4" /> Nuevo estudiante
                </Button>
            </Encabezado>

            {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, DNI, código o correo..."
                        className="pl-8"
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    {filtrados.length} de {estudiantes.length} estudiante(s) · {sinMovilidad} sin movilidad
                </p>
            </div>

            <div className="rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Correos</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Movilidad</TableHead>
                            <TableHead>Expediente</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cargando ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Cargando información...</TableCell>
                            </TableRow>
                        ) : filtrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <Vacio mensaje={estudiantes.length === 0 ? 'No hay estudiantes registrados.' : 'Ningún estudiante coincide con la búsqueda.'} />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtrados.map((estudiante) => (
                                <TableRow key={estudiante.id}>
                                    <TableCell>
                                        <p className="font-medium">
                                            {estudiante.apellido_paterno} {estudiante.apellido_materno}, {estudiante.nombres}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            DNI {estudiante.dni}
                                            {estudiante.semestre ? ` · ${etiquetaSemestre(estudiante.semestre)}` : ''}
                                        </p>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{estudiante.codigo_estudiante}</TableCell>
                                    <TableCell>
                                        <p className="text-xs">{estudiante.correo_institucional}</p>
                                        <p className="text-xs text-muted-foreground">{estudiante.correo_personal}</p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs">{estudiante.telefono_whatsapp || '—'}</p>
                                        <p className="text-xs text-muted-foreground">{estudiante.contacto_emergencia || 'Sin contacto de emergencia'}</p>
                                    </TableCell>
                                    <TableCell>
                                        {estudiante.movilidad_id ? (
                                            <div className="space-y-1">
                                                <EstadoMovilidadBadge estado={estudiante.estado} />
                                                <p className="text-xs text-muted-foreground">
                                                    {estudiante.universidad_destino || '—'}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Sin movilidad</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {estudiante.movilidad_id ? (
                                            <BarraProgreso
                                                valor={Number(estudiante.documentos_entregados || 0)}
                                                total={Number(estudiante.documentos_total || 0)}
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" title="Editar estudiante" onClick={() => abrirEdicion(estudiante)}>
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            {estudiante.movilidad_id ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/movilidades/${estudiante.movilidad_id}`)}
                                                >
                                                    <FolderOpen className="size-3.5" /> Expediente
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/movilidades?estudiante=${estudiante.id}`)}
                                                >
                                                    <Plane className="size-3.5" /> Movilidad
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                <DialogContent className="sm:max-w-[620px]">
                    <DialogHeader>
                        <DialogTitle>{editandoId ? 'Editar estudiante' : 'Registrar nuevo estudiante'}</DialogTitle>
                        <DialogDescription>
                            Los campos marcados con * son obligatorios. La fecha de registro se guarda automáticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI *</Label>
                            <Input id="dni" name="dni" required inputMode="numeric" maxLength={8} pattern="\d{8}"
                                value={formData.dni} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="codigo_estudiante">Código de estudiante *</Label>
                            <Input id="codigo_estudiante" name="codigo_estudiante" required
                                value={formData.codigo_estudiante} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nombres">Nombres *</Label>
                            <Input id="nombres" name="nombres" required value={formData.nombres} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="semestre">Semestre *</Label>
                            <Select
                                value={formData.semestre ? String(formData.semestre) : ''}
                                onValueChange={(valor) => setFormData({ ...formData, semestre: valor })}
                            >
                                <SelectTrigger id="semestre" className="w-full">
                                    <SelectValue placeholder="Seleccione el semestre..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEMESTRES.map((semestre) => (
                                        <SelectItem key={semestre} value={semestre}>
                                            {etiquetaSemestre(semestre)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellido_paterno">Apellido paterno *</Label>
                            <Input id="apellido_paterno" name="apellido_paterno" required
                                value={formData.apellido_paterno} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellido_materno">Apellido materno *</Label>
                            <Input id="apellido_materno" name="apellido_materno" required
                                value={formData.apellido_materno} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="correo_institucional">Correo institucional *</Label>
                            <Input id="correo_institucional" name="correo_institucional" type="email" required
                                value={formData.correo_institucional} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="correo_personal">Correo personal *</Label>
                            <Input id="correo_personal" name="correo_personal" type="email" required
                                value={formData.correo_personal} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefono_whatsapp">WhatsApp</Label>
                            <Input id="telefono_whatsapp" name="telefono_whatsapp"
                                value={formData.telefono_whatsapp} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="contacto_emergencia">Contacto de emergencia</Label>
                            <Input id="contacto_emergencia" name="contacto_emergencia"
                                placeholder="Ej: María Silva - 999 888 777"
                                value={formData.contacto_emergencia} onChange={handleChange} />
                        </div>

                        <div className="col-span-2 flex justify-end gap-3 mt-2">
                            <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={guardando}>
                                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar estudiante'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
