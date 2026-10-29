import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ESTADOS_MOVILIDAD } from '@/lib/catalogos';

function Campo({ etiqueta, htmlFor, requerido, children, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor={htmlFor}>
                {etiqueta} {requerido && <span className="text-destructive">*</span>}
            </Label>
            {children}
        </div>
    );
}

export default function FormularioMovilidad({ valor, onChange, estudiantes, bloquearEstudiante = false }) {
    const set = (campo, dato) => onChange({ ...valor, [campo]: dato });

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 border-b pb-1">
                <h4 className="text-sm font-semibold">Datos del estudiante</h4>
            </div>

            <Campo etiqueta="Estudiante" htmlFor="estudiante_id" requerido className="sm:col-span-2">
                <Select
                    value={valor.estudiante_id ? String(valor.estudiante_id) : ''}
                    onValueChange={(v) => set('estudiante_id', v)}
                    disabled={bloquearEstudiante}
                >
                    <SelectTrigger id="estudiante_id" className="w-full">
                        <SelectValue placeholder="Seleccione un estudiante..." />
                    </SelectTrigger>
                    <SelectContent>
                        {estudiantes.map((estudiante) => (
                            <SelectItem key={estudiante.id} value={String(estudiante.id)}>
                                {estudiante.apellido_paterno} {estudiante.apellido_materno}, {estudiante.nombres} — DNI {estudiante.dni}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Campo>

            <Campo etiqueta="Facultad de origen" htmlFor="facultad_origen" requerido>
                <Input id="facultad_origen" value={valor.facultad_origen} onChange={(e) => set('facultad_origen', e.target.value)} />
            </Campo>
            <Campo etiqueta="Escuela profesional" htmlFor="escuela_profesional">
                <Input id="escuela_profesional" value={valor.escuela_profesional} onChange={(e) => set('escuela_profesional', e.target.value)} />
            </Campo>

            <div className="sm:col-span-2 border-t pt-3">
                <h4 className="text-sm font-semibold">Datos del destino</h4>
            </div>

            <Campo etiqueta="Universidad de destino" htmlFor="universidad_destino" requerido>
                <Input id="universidad_destino" value={valor.universidad_destino} onChange={(e) => set('universidad_destino', e.target.value)} />
            </Campo>
            <Campo etiqueta="Facultad de destino" htmlFor="facultad_destino" requerido>
                <Input id="facultad_destino" value={valor.facultad_destino} onChange={(e) => set('facultad_destino', e.target.value)} />
            </Campo>
            <Campo etiqueta="País" htmlFor="pais_destino" requerido>
                <Input id="pais_destino" value={valor.pais_destino} onChange={(e) => set('pais_destino', e.target.value)} />
            </Campo>
            <Campo etiqueta="Ciudad" htmlFor="ciudad_destino" requerido>
                <Input id="ciudad_destino" value={valor.ciudad_destino} onChange={(e) => set('ciudad_destino', e.target.value)} />
            </Campo>
            <Campo etiqueta="Dirección exacta de residencia en el extranjero" htmlFor="direccion_residencia" requerido className="sm:col-span-2">
                <Textarea
                    id="direccion_residencia"
                    className="resize-none"
                    placeholder="Calle, número, distrito, ciudad y referencias"
                    value={valor.direccion_residencia}
                    onChange={(e) => set('direccion_residencia', e.target.value)}
                />
            </Campo>

            <div className="sm:col-span-2 border-t pt-3">
                <h4 className="text-sm font-semibold">Fechas y estado</h4>
            </div>

            <Campo etiqueta="Fecha de salida del país" htmlFor="fecha_salida" requerido>
                <Input id="fecha_salida" type="date" value={valor.fecha_salida} onChange={(e) => set('fecha_salida', e.target.value)} />
            </Campo>
            <Campo etiqueta="Fecha de retorno" htmlFor="fecha_retorno" requerido>
                <Input id="fecha_retorno" type="date" value={valor.fecha_retorno} onChange={(e) => set('fecha_retorno', e.target.value)} />
            </Campo>
            <Campo etiqueta="Postulado" htmlFor="postulado" requerido>
                <Select value={valor.postulado ? 'si' : 'no'} onValueChange={(v) => set('postulado', v === 'si')}>
                    <SelectTrigger id="postulado" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="si">SÍ</SelectItem>
                        <SelectItem value="no">NO</SelectItem>
                    </SelectContent>
                </Select>
            </Campo>
            <Campo etiqueta="Estado de la movilidad" htmlFor="estado" requerido>
                <Select value={valor.estado} onValueChange={(v) => set('estado', v)}>
                    <SelectTrigger id="estado" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {ESTADOS_MOVILIDAD.map((estado) => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Campo>
            <Campo etiqueta="Observaciones" htmlFor="observaciones" className="sm:col-span-2">
                <Textarea
                    id="observaciones"
                    className="resize-none"
                    placeholder="Notas internas de la movilidad"
                    value={valor.observaciones || ''}
                    onChange={(e) => set('observaciones', e.target.value)}
                />
            </Campo>
        </div>
    );
}
