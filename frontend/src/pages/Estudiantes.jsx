import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Users, Plus } from "lucide-react";

export default function Estudiantes() {
    const [estudiantes, setEstudiantes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);

    // Estado para almacenar los datos que el usuario escribe en el formulario
    const [formData, setFormData] = useState({
        dni: "", codigo_estudiante: "", nombres: "", apellido_paterno: "",
        apellido_materno: "", correo_personal: "", correo_institucional: "",
        telefono_whatsapp: "", contacto_emergencia: ""
    });

    // Función para cargar los estudiantes desde el backend
    const cargarEstudiantes = async () => {
        try {
            const respuesta = await api.get('/estudiantes');
            if (respuesta.data.exito) {
                setEstudiantes(respuesta.data.datos);
            }
        } catch (error) {
            console.error("Error al cargar estudiantes:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarEstudiantes();
    }, []);

    // Función que actualiza el estado cada vez que el usuario teclea algo
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Función que se ejecuta al presionar "Guardar Estudiante"
    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que la página se recargue
        try {
            // 1. Enviamos el POST a tu backend
            const respuesta = await api.post('/estudiantes', formData);

            if (respuesta.data.exito) {
                // 2. Si fue exitoso, recargamos la tabla para ver al nuevo estudiante
                cargarEstudiantes();
                // 3. Cerramos el modal
                setModalAbierto(false);
                // 4. Limpiamos las cajas de texto para la próxima vez
                setFormData({
                    dni: "", codigo_estudiante: "", nombres: "", apellido_paterno: "",
                    apellido_materno: "", correo_personal: "", correo_institucional: "",
                    telefono_whatsapp: "", contacto_emergencia: ""
                });
            }
        } catch (error) {
            // Si el backend lanza un error (como DNI duplicado), lo mostramos
            alert(error.response?.data?.mensaje || "Ocurrió un error al registrar.");
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Cabecera */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Users className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Estudiantes</h1>
                        <p className="text-muted-foreground">Gestiona el padrón de alumnos en proceso de movilidad.</p>
                    </div>
                </div>
                <Button onClick={() => setModalAbierto(true)} className="gap-2">
                    <Plus className="size-4" />
                    Nuevo Estudiante
                </Button>
            </div>

            {/* Tabla */}
            <div className="border border-border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>DNI</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombres Completos</TableHead>
                            <TableHead>Correo Institucional</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cargando ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Cargando información...
                                </TableCell>
                            </TableRow>
                        ) : estudiantes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No hay estudiantes registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            estudiantes.map((estudiante) => (
                                <TableRow key={estudiante.id}>
                                    <TableCell className="font-medium">{estudiante.dni}</TableCell>
                                    <TableCell>{estudiante.codigo_estudiante}</TableCell>
                                    <TableCell>{`${estudiante.nombres} ${estudiante.apellido_paterno} ${estudiante.apellido_materno}`}</TableCell>
                                    <TableCell>{estudiante.correo_institucional}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Ventana Modal para Registrar Estudiante */}
            <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Registrar Nuevo Estudiante</DialogTitle>
                        <DialogDescription>
                            Completa los datos del estudiante. Los campos marcados con * son obligatorios.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI *</Label>
                            <Input id="dni" name="dni" required maxLength={8} value={formData.dni} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="codigo_estudiante">Código Estudiante *</Label>
                            <Input id="codigo_estudiante" name="codigo_estudiante" required value={formData.codigo_estudiante} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="nombres">Nombres *</Label>
                            <Input id="nombres" name="nombres" required value={formData.nombres} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellido_paterno">Apellido Paterno *</Label>
                            <Input id="apellido_paterno" name="apellido_paterno" required value={formData.apellido_paterno} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellido_materno">Apellido Materno *</Label>
                            <Input id="apellido_materno" name="apellido_materno" required value={formData.apellido_materno} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="correo_institucional">Correo Institucional *</Label>
                            <Input id="correo_institucional" name="correo_institucional" type="email" required value={formData.correo_institucional} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="correo_personal">Correo Personal</Label>
                            <Input id="correo_personal" name="correo_personal" type="email" value={formData.correo_personal} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefono_whatsapp">WhatsApp</Label>
                            <Input id="telefono_whatsapp" name="telefono_whatsapp" value={formData.telefono_whatsapp} onChange={handleChange} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="contacto_emergencia">Contacto de Emergencia</Label>
                            <Input id="contacto_emergencia" name="contacto_emergencia" placeholder="Ej: Maria Silva - 999888777" value={formData.contacto_emergencia} onChange={handleChange} />
                        </div>

                        <div className="col-span-2 flex justify-end gap-3 mt-4">
                            <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Guardar Estudiante</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}