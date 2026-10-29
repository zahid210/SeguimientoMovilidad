import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {api} from "@/lib/axios";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {Plane, Plus, FolderOpen} from "lucide-react";

export default function Movilidades() {
    const [movilidades, setMovilidades] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const navigate = useNavigate();

    const estadoInicialForm = {
        estudiante_id: "", facultad_origen: "", escuela_profesional: "",
        semestre_viaje: "", universidad_destino: "", facultad_destino: "",
        pais_destino: "", ciudad_destino: "", programa_convenio: ""
    };
    const [formData, setFormData] = useState(estadoInicialForm);

    // Cargamos viajes y estudiantes al mismo tiempo
    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [resMovilidades, resEstudiantes] = await Promise.all([
                api.get('/movilidades'),
                api.get('/estudiantes')
            ]);

            if (resMovilidades.data.exito) setMovilidades(resMovilidades.data.datos);
            if (resEstudiantes.data.exito) setEstudiantes(resEstudiantes.data.datos);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // Manejador para inputs de texto normales
    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    // Manejador especial para el componente Select de shadcn
    const handleSelectChange = (value, name) => {
        setFormData({...formData, [name]: value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const respuesta = await api.post('/movilidades', formData);
            if (respuesta.data.exito) {
                cargarDatos();
                setModalAbierto(false);
                setFormData(estadoInicialForm);
            }
        } catch (error) {
            alert(error.response?.data?.mensaje || "Error al registrar la movilidad.");
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Plane className="size-6"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Movilidades</h1>
                        <p className="text-muted-foreground">Gestiona los viajes y destinos de los estudiantes.</p>
                    </div>
                </div>
                <Button onClick={() => setModalAbierto(true)} className="gap-2">
                    <Plus className="size-4"/>
                    Nueva Movilidad
                </Button>
            </div>

            <div className="border border-border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead>Semestre</TableHead>
                            <TableHead>Programa</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cargando ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Cargando
                                    información...</TableCell>
                            </TableRow>
                        ) : movilidades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No hay
                                    movilidades registradas.</TableCell>
                            </TableRow>
                        ) : (
                            movilidades.map((mov) => (
                                <TableRow key={mov.id}>
                                    <TableCell className="font-medium">
                                        {/* Aquí usamos los datos que trajimos con el INNER JOIN desde MySQL */}
                                        {mov.nombres} {mov.apellido_paterno}
                                        <div className="text-xs text-muted-foreground">DNI: {mov.dni}</div>
                                    </TableCell>
                                    <TableCell>
                                        {mov.universidad_destino}
                                        <div
                                            className="text-xs text-muted-foreground">{mov.ciudad_destino}, {mov.pais_destino}</div>
                                    </TableCell>
                                    <TableCell>{mov.semestre_viaje}</TableCell>
                                    <TableCell>{mov.programa_convenio}</TableCell>
                                    <TableCell>
                    <span
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                      {mov.estado}
                    </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm"
                                                onClick={() => navigate(`/movilidades/${mov.id}`)}>
                                            <FolderOpen className="size-4 mr-2"/>
                                            Expediente
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Registrar Nueva Movilidad</DialogTitle>
                        <DialogDescription>Asigna un viaje internacional a un estudiante registrado.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2 col-span-2">
                            <Label>Estudiante *</Label>
                            <Select
                                onValueChange={(value) => handleSelectChange(value, "estudiante_id")}
                                value={formData.estudiante_id}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un estudiante..."/>
                                </SelectTrigger>
                                <SelectContent>
                                    {estudiantes.map((est) => (
                                        <SelectItem key={est.id} value={est.id.toString()}>
                                            {est.dni} - {est.nombres} {est.apellido_paterno}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Facultad Origen *</Label>
                            <Input name="facultad_origen" required value={formData.facultad_origen}
                                   onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Escuela Profesional *</Label>
                            <Input name="escuela_profesional" required value={formData.escuela_profesional}
                                   onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Semestre de Viaje (Ej: 2026-I) *</Label>
                            <Input name="semestre_viaje" required value={formData.semestre_viaje}
                                   onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Programa / Convenio</Label>
                            <Input name="programa_convenio" value={formData.programa_convenio} onChange={handleChange}/>
                        </div>

                        <div className="col-span-2 border-t pt-4 mt-2">
                            <h4 className="text-sm font-medium mb-4">Datos del Destino</h4>
                        </div>

                        <div className="space-y-2">
                            <Label>Universidad Destino *</Label>
                            <Input name="universidad_destino" required value={formData.universidad_destino}
                                   onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Facultad Destino *</Label>
                            <Input name="facultad_destino" required value={formData.facultad_destino}
                                   onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label>País *</Label>
                            <Input name="pais_destino" required value={formData.pais_destino} onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Ciudad *</Label>
                            <Input name="ciudad_destino" required value={formData.ciudad_destino}
                                   onChange={handleChange}/>
                        </div>

                        <div className="col-span-2 flex justify-end gap-3 mt-4">
                            <Button type="button" variant="outline"
                                    onClick={() => setModalAbierto(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Movilidad</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}