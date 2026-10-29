import { AlertTriangle, CheckCircle2, Clock3, CircleDashed, Inbox } from 'lucide-react';
import { claseEstadoMovilidad, claseEstadoMonitoreo } from '@/lib/catalogos';
import { estadoMonitoreo, formatearFecha } from '@/lib/fechas';

export function Encabezado({ icono: Icono, titulo, descripcion, children }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
                {Icono && (
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Icono className="size-6" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
                    {descripcion && <p className="text-muted-foreground">{descripcion}</p>}
                </div>
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}

export function EstadoMovilidadBadge({ estado }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${claseEstadoMovilidad(estado)}`}>
            {estado || 'Sin movilidad'}
        </span>
    );
}

export function EstadoMonitoreoBadge({ estado }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${claseEstadoMonitoreo(estado)}`}>
            {estado}
        </span>
    );
}

export function ChipExpediente({ entregados = 0, total = 0, completo }) {
    const activo = completo ?? (total > 0 && entregados === total);
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                activo
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
        >
            {activo ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
            {activo ? 'Completo' : `${entregados}/${total} docs`}
        </span>
    );
}

export function BarraProgreso({ valor = 0, total = 0, className = '' }) {
    const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0;
    const color = porcentaje === 100 ? 'bg-emerald-500' : porcentaje >= 50 ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${porcentaje}%` }} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
                {valor}/{total}
            </span>
        </div>
    );
}

export function AlertaMonitoreo({ proximo, vencido, compacto = false }) {
    const info = estadoMonitoreo(proximo);

    if (!proximo) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CircleDashed className="size-3.5" />
                {vencido ? 'Vencido' : 'Sin programar'}
            </span>
        );
    }

    const colores = {
        vencido: 'border-rose-200 bg-rose-50 text-rose-700',
        hoy: 'border-amber-200 bg-amber-50 text-amber-700',
        proximo: 'border-amber-200 bg-amber-50 text-amber-700',
        ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        neutro: 'border-border bg-muted text-muted-foreground'
    };

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colores[info.tono]}`}>
            {info.tono === 'vencido' ? <AlertTriangle className="size-3" /> : <Clock3 className="size-3" />}
            {compacto ? info.texto : `${formatearFecha(proximo)} · ${info.texto}`}
        </span>
    );
}

export function Aviso({ tipo = 'info', children }) {
    const estilos = {
        info: 'border-sky-200 bg-sky-50 text-sky-800',
        exito: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        error: 'border-rose-200 bg-rose-50 text-rose-800',
        aviso: 'border-amber-200 bg-amber-50 text-amber-800'
    };

    return (
        <div className={`rounded-lg border px-4 py-3 text-sm ${estilos[tipo] || estilos.info}`}>
            {children}
        </div>
    );
}

export function Vacio({ mensaje = 'No hay información para mostrar.' }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Inbox className="size-8" />
            <p className="text-sm">{mensaje}</p>
        </div>
    );
}

export function Dato({ etiqueta, valor, className = '' }) {
    return (
        <div className={className}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
            <p className="mt-0.5 text-sm font-medium break-words">{valor || '—'}</p>
        </div>
    );
}
