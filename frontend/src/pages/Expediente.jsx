import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // <-- Nuevo componente
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileText, Activity, Upload, CheckCircle2, MessageSquare } from "lucide-react";

export default function Expediente() {
    const { id } = useParams();
    const navigate = useNavigate();

    // ================= ESTADOS: DOCUMENTOS =================
    const [documentos, setDocumentos] = useState([]);
    const [tipoDoc, setTipoDoc] = useState("");
    const [archivo, setArchivo] = useState(null);
    const [subiendo, setSubiendo] = useState(false);
    const fileInputRef = useRef(null);

    // ================= ESTADOS: MONITOREOS =================
    const [monitoreos, setMonitoreos] = useState([]);
    const [formMonitoreo, setFormMonitoreo] = useState({
        fecha_registro: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
        estado_estudiante: "Sin novedades",
        observaciones: ""
    });

    // ================= CARGA INICIAL DE DATOS =================
    const cargarDatos = async () => {
        try {
            // Ejecutamos ambas consultas al mismo tiempo para que sea más rápido
            const [resDocs, resMonitoreos] = await Promise.all([
                api.get(`/documentos/${id}`),
                api.get(`/monitoreos/${id}`)
            ]);

            if (resDocs.data.exito) setDocumentos(resDocs.data.datos);
            if (resMonitoreos.data.exito) setMonitoreos(resMonitoreos.data.datos);
        } catch (error) {
            console.error("Error al cargar expediente:", error);
        }
    };

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ================= HANDLERS =================
    const handleSubirDocumento = async (e) => {
        e.preventDefault();
        if (!tipoDoc || !archivo) return alert("Faltan datos.");

        try {
            setSubiendo(true);
            const formData = new FormData();
            formData.append("movilidad_id", id);
            formData.append("tipo_documento", tipoDoc);
            formData.append("anio", new Date().getFullYear());
            formData.append("archivo", archivo);

            const respuesta = await api.post('/documentos', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (respuesta.data.exito) {
                cargarDatos();
                setTipoDoc("");
                setArchivo(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (error) {
            alert("Error al subir el documento.");
        } finally {
            setSubiendo(false);
        }
    };

    const handleSubirMonitoreo = async (e) => {
        e.preventDefault();
        try {
            const respuesta = await api.post('/monitoreos', {
                movilidad_id: id,
                ...formMonitoreo
            });

            if (respuesta.data.exito) {
                cargarDatos(); // Recarga la tabla de monitoreos
                setFormMonitoreo({ // Limpia el formulario
                    fecha_registro: new Date().toISOString().split('T')[0],
                    estado_estudiante: "Sin novedades",
                    observaciones: ""
                });
            }
        } catch (error) {
            alert("Error al registrar el monitoreo.");
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Expediente de Movilidad #{id}</h1>
                    <p className="text-muted-foreground">Gestiona los documentos físicos y el monitoreo quincenal.</p>
                </div>
            </div>

            <Tabs defaultValue="documentos" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="documentos" className="gap-2"><FileText className="size-4"/> Documentos</TabsTrigger>
                    <TabsTrigger value="monitoreos" className="gap-2"><Activity className="size-4"/> Monitoreos</TabsTrigger>
                </TabsList>

                {/* ================= PESTAÑA 1: DOCUMENTOS ================= */}
                <TabsContent value="documentos" className="mt-6 space-y-6">
                    <div className="border border-border rounded-lg bg-card p-6">
                        <h3 className="text-lg font-medium mb-4">Subir Nuevo Documento</h3>
                        <form onSubmit={handleSubirDocumento} className="flex items-end gap-4">
                            <div className="space-y-2 flex-1">
                                <Label>Tipo de Documento *</Label>
                                <Select value={tipoDoc} onValueChange={setTipoDoc} required>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="carta_aceptacion">Carta de Aceptación</SelectItem>
                                        <SelectItem value="compromiso_padres">Compromiso de Padres</SelectItem>
                                        <SelectItem value="seguro_internacional">Seguro Internacional</SelectItem>
                                        <SelectItem value="visa">Visa</SelectItem>
                                        <SelectItem value="resolucion_facultad">Resolución de Facultad</SelectItem>
                                        <SelectItem value="equivalencia_notas">Equivalencia de Notas</SelectItem>
                                        <SelectItem value="expediente_completo">Expediente Completo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label>Archivo PDF *</Label>
                                <Input type="file" accept="application/pdf" ref={fileInputRef} onChange={(e) => setArchivo(e.target.files[0])} required />
                            </div>
                            <Button type="submit" disabled={subiendo || !archivo || !tipoDoc} className="gap-2">
                                <Upload className="size-4" />
                                {subiendo ? "Subiendo..." : "Subir PDF"}
                            </Button>
                        </form>
                    </div>

                    <div className="border border-border rounded-lg bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Última Actualización</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documentos.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No hay documentos subidos.</TableCell></TableRow>
                                ) : (
                                    documentos.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium capitalize">{doc.tipo_documento.replace(/_/g, ' ')}</TableCell>
                                            <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle2 className="size-3" /> {doc.estado_entrega}
                        </span>
                                            </TableCell>
                                            <TableCell>{new Date(doc.fecha_actualizacion).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="link" size="sm" asChild>
                                                    <a href={`http://localhost:3000${doc.ruta_archivo}`} target="_blank" rel="noreferrer">Ver PDF</a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* ================= PESTAÑA 2: MONITOREOS ================= */}
                <TabsContent value="monitoreos" className="mt-6 space-y-6">
                    <div className="border border-border rounded-lg bg-card p-6">
                        <h3 className="text-lg font-medium mb-4">Registrar Nuevo Reporte</h3>
                        <form onSubmit={handleSubirMonitoreo} className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha del Reporte *</Label>
                                <Input
                                    type="date"
                                    value={formMonitoreo.fecha_registro}
                                    onChange={(e) => setFormMonitoreo({...formMonitoreo, fecha_registro: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado del Estudiante *</Label>
                                <Select
                                    value={formMonitoreo.estado_estudiante}
                                    onValueChange={(val) => setFormMonitoreo({...formMonitoreo, estado_estudiante: val})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sin novedades">Sin novedades (Todo en orden)</SelectItem>
                                        <SelectItem value="Requiere atención">Requiere atención (Problemas menores)</SelectItem>
                                        <SelectItem value="Emergencia">Emergencia (Acción inmediata)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Observaciones</Label>
                                <Textarea
                                    placeholder="Detalles del seguimiento quincenal..."
                                    value={formMonitoreo.observaciones}
                                    onChange={(e) => setFormMonitoreo({...formMonitoreo, observaciones: e.target.value})}
                                    className="resize-none"
                                />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <Button type="submit" className="gap-2">
                                    <MessageSquare className="size-4" />
                                    Guardar Reporte
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="border border-border rounded-lg bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Observaciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monitoreos.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No hay reportes de monitoreo registrados.</TableCell></TableRow>
                                ) : (
                                    monitoreos.map((mon) => (
                                        <TableRow key={mon.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {new Date(mon.fecha_registro).toLocaleDateString('es-PE')}
                                            </TableCell>
                                            <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                          ${mon.estado_estudiante === 'Sin novedades' ? 'bg-green-100 text-green-700' :
                            mon.estado_estudiante === 'Requiere atención' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'}`}>
                          {mon.estado_estudiante}
                        </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{mon.observaciones || "-"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}