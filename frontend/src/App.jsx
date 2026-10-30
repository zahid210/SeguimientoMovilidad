import { useEffect, useMemo, useRef, useState } from 'react';
import { api, URL_EXPORT, urlArchivo } from '@/lib/axios';
import { ESTADOS_MOVILIDAD, ESTADOS_MONITOREO, MEDIOS_CONTACTO, SEMESTRES } from '@/lib/catalogos';
import { formatearFecha, hoyISO } from '@/lib/fechas';

const NOMBRES_SEMESTRE = {
    '1': 'Primero (1.º)',
    '2': 'Segundo (2.º)',
    '3': 'Tercero (3.º)',
    '4': 'Cuarto (4.º)',
    '5': 'Quinto (5.º)',
    '6': 'Sexto (6.º)',
    '7': 'Séptimo (7.º)',
    '8': 'Octavo (8.º)',
    '9': 'Noveno (9.º)',
    '10': 'Décimo (10.º)'
};

const ETIQUETAS_CORTAS_DOC = {
    expediente_fisico: 'EXPEDIENTE FÍSICO',
    pre_equivalencia: 'PRE EQUIVALENCIA',
    carta_aceptacion: 'CARTA DE ACEPTACIÓN',
    notificacion_facultad: 'NOTIFICACIÓN FACULTAD',
    notificacion_estudiante: 'NOTIFICACIÓN ESTUDIANTE',
    compromiso_padres: 'COMPROMISO PADRES',
    seguro_medico: 'SEGURO MÉDICO',
    seguro_psicologico: 'SEGURO PSICOLÓGICO',
    resolucion_facultad: 'RESOLUCIÓN FACULTAD',
    constancia_induccion: 'CONSTANCIA INDUCCIÓN',
    visa: 'VISA',
    certificado_estudios: 'CERTIFICADO ESTUDIOS',
    equivalencia_notas: 'EQUIVALENCIA NOTAS',
    comunicado_facultad: 'COMUNICADO FACULTAD'
};

const FORM_INICIAL = {
    dni: '',
    codigo_estudiante: '',
    semestre: '8',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo_institucional: '',
    correo_personal: '',
    telefono_whatsapp: '',
    contacto_emergencia: '',
    facultad_origen: '',
    escuela_profesional: '',
    universidad_destino: '',
    facultad_destino: '',
    pais_destino: '',
    ciudad_destino: '',
    direccion_residencia: '',
    fecha_salida: hoyISO(),
    fecha_retorno: hoyISO(),
    postulado: true,
    estado: 'Postulando',
    observaciones: ''
};

function normalizarBusqueda(valor) {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function IconoArchivoMas() {
    return (
        <svg className="file-icon" viewBox="0 0 64 64" fill="none">
            <path d="M19 7H36L49 20V47 A9 9 0 0 1 40 56H19 A9 9 0 0 1 10 47V16 A9 9 0 0 1 19 7Z" />
            <path d="M36 7V20H49" />
            <path d="M30 33V49" />
            <path d="M22 41H38" />
        </svg>
    );
}

function IconoArchivoCheck() {
    return (
        <svg className="file-icon" viewBox="0 0 64 64" fill="none">
            <path d="M19 7H36L49 20V47 A9 9 0 0 1 40 56H19 A9 9 0 0 1 10 47V16 A9 9 0 0 1 19 7Z" />
            <path d="M36 7V20H49" />
            <path d="M21 40L28 47L41 33" />
        </svg>
    );
}

function IconoLapiz() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
        </svg>
    );
}

function IconoMonitoreo() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M9 16l2 2 4-4" />
        </svg>
    );
}

function IconoReemplazar() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
        </svg>
    );
}

function IconoPapelera() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}

export default function App() {
    const [filas, setFilas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [subiendoClave, setSubiendoClave] = useState(null);
    const [avisoGlobal, setAvisoGlobal] = useState(null);
    const [filaResaltada, setFilaResaltada] = useState(null);

    // Modal de Agregar / Editar Estudiante
    const [modalFormulario, setModalFormulario] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(null); // null = nuevo estudiante, objeto = editando fila
    const [formData, setFormData] = useState(FORM_INICIAL);
    const [guardandoForm, setGuardandoForm] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    // Modal independiente de Monitoreo Quincenal
    const [filaMonitoreo, setFilaMonitoreo] = useState(null);
    const [monitoreos, setMonitoreos] = useState([]);
    const [cargandoMonitoreos, setCargandoMonitoreos] = useState(false);
    const [errorMonitoreo, setErrorMonitoreo] = useState('');
    const [formMonitoreo, setFormMonitoreo] = useState({
        fecha_registro: hoyISO(),
        estado_estudiante: 'Sin novedades',
        medio_contacto: 'WhatsApp',
        responsable: '',
        observaciones: ''
    });

    // Modal de Alertas (Notificaciones)
    const [modalAlertas, setModalAlertas] = useState(false);

    // Input de archivo oculto compartido para subir/reemplazar PDF
    const fileInputRef = useRef(null);
    const destinoSubidaRef = useRef(null);

    const mostrarAviso = (texto, tipo = 'ok') => {
        setAvisoGlobal({ texto, tipo });
        setTimeout(() => {
            setAvisoGlobal((actual) => (actual?.texto === texto ? null : actual));
        }, 4000);
    };

    const cargarTodo = async () => {
        try {
            const res = await api.get('/movilidades');
            if (res.data.exito) {
                setFilas(res.data.datos || []);
            }
        } catch (err) {
            mostrarAviso(err.response?.data?.mensaje || 'Error al conectar con el servidor.', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activo = true;
        (async () => {
            try {
                const res = await api.get('/movilidades');
                if (activo && res.data.exito) {
                    setFilas(res.data.datos || []);
                }
            } catch (err) {
                if (activo) {
                    setAvisoGlobal({
                        texto: err.response?.data?.mensaje || 'Error al conectar con el servidor.',
                        tipo: 'error'
                    });
                }
            } finally {
                if (activo) setCargando(false);
            }
        })();
        return () => {
            activo = false;
        };
    }, []);

    // Filtrado rápido por buscador
    const filasFiltradas = useMemo(() => {
        const q = normalizarBusqueda(busqueda);
        if (!q) return filas;
        return filas.filter((f) => {
            const texto = normalizarBusqueda([
                f.nombres,
                f.apellido_paterno,
                f.apellido_materno,
                f.dni,
                f.codigo_estudiante,
                f.correo_institucional,
                f.correo_personal,
                f.universidad_destino,
                f.pais_destino
            ].join(' '));
            return texto.includes(q);
        });
    }, [filas, busqueda]);

    // Cálculo de alertas (documentos en "NO" y monitoreos vencidos/próximos)
    const alertas = useMemo(() => {
        const lista = [];
        for (const fila of filas) {
            const docs = fila.documentos || [];
            const entregados = docs.filter((d) => d.estado_entrega === 'Entregado');
            const pendientes = docs.filter((d) => d.estado_entrega !== 'Entregado');
            const expedienteCompleto = docs.length > 0 && pendientes.length === 0;
            const monitoreoVencido = Boolean(fila.monitoreo_vencido);

            if (!expedienteCompleto || monitoreoVencido) {
                lista.push({
                    id: fila.id,
                    estudiante_id: fila.estudiante_id,
                    nombreCompleto: `${fila.nombres} ${fila.apellido_paterno} ${fila.apellido_materno}`,
                    dni: fila.dni,
                    estado: fila.estado,
                    destino: `${fila.universidad_destino} (${fila.pais_destino})`,
                    entregadosCount: entregados.length,
                    totalCount: docs.length || 14,
                    entregados,
                    pendientes,
                    expedienteCompleto,
                    monitoreoVencido,
                    proximoMonitoreo: fila.proximo_monitoreo,
                    urgente: monitoreoVencido || (fila.estado === 'En Extranjero' && !expedienteCompleto)
                });
            }
        }
        return lista;
    }, [filas]);

    // =========================================================
    // Subida, reemplazo y eliminación de documentos PDF ("SÍ" / "NO")
    // =========================================================
    const abrirSelectorPdf = (movilidadId, tipoDocumento) => {
        destinoSubidaRef.current = { movilidadId, tipoDocumento };
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const subirArchivoPdf = async (movilidadId, tipoDocumento, archivo) => {
        if (!archivo) return;
        if (archivo.type !== 'application/pdf' && !archivo.name.toLowerCase().endsWith('.pdf')) {
            mostrarAviso('Solo se permiten archivos en formato PDF.', 'error');
            return;
        }

        const clave = `${movilidadId}-${tipoDocumento}`;
        setSubiendoClave(clave);

        try {
            const data = new FormData();
            data.append('movilidad_id', String(movilidadId));
            data.append('tipo_documento', tipoDocumento);
            data.append('archivo', archivo);

            const res = await api.post('/documentos', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.exito) {
                await cargarTodo();
                mostrarAviso(`Documento adjuntado (${ETIQUETAS_CORTAS_DOC[tipoDocumento] || tipoDocumento}).`);
            }
        } catch (err) {
            mostrarAviso(err.response?.data?.mensaje || 'No se pudo adjuntar el PDF.', 'error');
        } finally {
            setSubiendoClave(null);
        }
    };

    const onFileChange = async (e) => {
        const archivo = e.target.files?.[0];
        const destino = destinoSubidaRef.current;
        if (archivo && destino) {
            await subirArchivoPdf(destino.movilidadId, destino.tipoDocumento, archivo);
        }
    };

    const quitarDocumentoPdf = async (e, movilidadId, tipoDocumento) => {
        e.stopPropagation();
        const clave = `${movilidadId}-${tipoDocumento}`;
        setSubiendoClave(clave);

        try {
            const res = await api.delete(`/documentos/${movilidadId}/${tipoDocumento}`);
            if (res.data.exito) {
                await cargarTodo();
                mostrarAviso(`Documento quitado (${ETIQUETAS_CORTAS_DOC[tipoDocumento] || tipoDocumento}).`);
            }
        } catch (err) {
            mostrarAviso(err.response?.data?.mensaje || 'No se pudo quitar el documento.', 'error');
        } finally {
            setSubiendoClave(null);
        }
    };

    const manejarClickDropzone = (movilidadId, doc) => {
        const adjunto = doc.estado_entrega === 'Entregado' && doc.ruta_archivo;
        if (adjunto) {
            const url = urlArchivo(doc.ruta_archivo);
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            abrirSelectorPdf(movilidadId, doc.tipo_documento);
        }
    };

    // =========================================================
    // Modal: Agregar Nuevo Estudiante / Editar Estudiante
    // =========================================================
    const abrirModalNuevo = () => {
        setModoEdicion(null);
        setFormData({
            ...FORM_INICIAL,
            fecha_salida: hoyISO(),
            fecha_retorno: hoyISO()
        });
        setErrorForm('');
        setModalFormulario(true);
    };

    const cargarMonitoreosDeFila = async (movilidadId) => {
        setCargandoMonitoreos(true);
        try {
            const res = await api.get(`/monitoreos/${movilidadId}`);
            if (res.data.exito) {
                setMonitoreos(res.data.datos || []);
            }
        } catch {
            setMonitoreos([]);
        } finally {
            setCargandoMonitoreos(false);
        }
    };

    const abrirModalEditar = (fila) => {
        setModoEdicion(fila);
        setFormData({
            dni: fila.dni || '',
            codigo_estudiante: fila.codigo_estudiante || '',
            semestre: fila.semestre ? String(fila.semestre) : '8',
            nombres: fila.nombres || '',
            apellido_paterno: fila.apellido_paterno || '',
            apellido_materno: fila.apellido_materno || '',
            correo_institucional: fila.correo_institucional || '',
            correo_personal: fila.correo_personal || '',
            telefono_whatsapp: fila.telefono_whatsapp || '',
            contacto_emergencia: fila.contacto_emergencia || '',
            facultad_origen: fila.facultad_origen === 'Por definir' ? '' : (fila.facultad_origen || ''),
            escuela_profesional: fila.escuela_profesional || '',
            universidad_destino: fila.universidad_destino === 'Por definir' ? '' : (fila.universidad_destino || ''),
            facultad_destino: fila.facultad_destino === 'Por definir' ? '' : (fila.facultad_destino || ''),
            pais_destino: fila.pais_destino === 'Por definir' ? '' : (fila.pais_destino || ''),
            ciudad_destino: fila.ciudad_destino === 'Por definir' ? '' : (fila.ciudad_destino || ''),
            direccion_residencia: fila.direccion_residencia === 'Por definir' ? '' : (fila.direccion_residencia || ''),
            fecha_salida: String(fila.fecha_salida || hoyISO()).slice(0, 10),
            fecha_retorno: String(fila.fecha_retorno || hoyISO()).slice(0, 10),
            postulado: Boolean(fila.postulado),
            estado: fila.estado || 'Postulando',
            observaciones: fila.observaciones || ''
        });
        setErrorForm('');
        setModalFormulario(true);
    };

    const abrirModalMonitoreo = (fila) => {
        setFilaMonitoreo(fila);
        setErrorMonitoreo('');
        setFormMonitoreo({
            fecha_registro: hoyISO(),
            estado_estudiante: 'Sin novedades',
            medio_contacto: 'WhatsApp',
            responsable: '',
            observaciones: ''
        });
        cargarMonitoreosDeFila(fila.id);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const guardarEstudianteYMovilidad = async (e) => {
        e.preventDefault();
        setErrorForm('');

        if (!/^\d{8}$/.test(formData.dni.trim())) {
            setErrorForm('El DNI debe tener exactamente 8 dígitos numéricos.');
            return;
        }

        const fechaSalida = formData.fecha_salida || hoyISO();
        const fechaRetorno = formData.fecha_retorno && formData.fecha_retorno >= fechaSalida
            ? formData.fecha_retorno
            : fechaSalida;

        const payloadEstudiante = {
            dni: formData.dni.trim(),
            codigo_estudiante: formData.codigo_estudiante.trim(),
            semestre: String(formData.semestre),
            nombres: formData.nombres.trim(),
            apellido_paterno: formData.apellido_paterno.trim(),
            apellido_materno: formData.apellido_materno.trim(),
            correo_institucional: formData.correo_institucional.trim(),
            correo_personal: formData.correo_personal.trim(),
            telefono_whatsapp: formData.telefono_whatsapp.trim() || null,
            contacto_emergencia: formData.contacto_emergencia.trim() || null
        };

        const payloadMovilidad = {
            facultad_origen: formData.facultad_origen.trim() || 'Por definir',
            escuela_profesional: formData.escuela_profesional.trim() || null,
            universidad_destino: formData.universidad_destino.trim() || 'Por definir',
            facultad_destino: formData.facultad_destino.trim() || 'Por definir',
            pais_destino: formData.pais_destino.trim() || 'Por definir',
            ciudad_destino: formData.ciudad_destino.trim() || 'Por definir',
            direccion_residencia: formData.direccion_residencia.trim() || 'Por definir',
            fecha_salida: fechaSalida,
            fecha_retorno: fechaRetorno,
            postulado: Boolean(formData.postulado),
            estado: formData.estado || 'Postulando',
            observaciones: formData.observaciones.trim() || null
        };

        try {
            setGuardandoForm(true);

            if (modoEdicion) {
                await api.put(`/estudiantes/${modoEdicion.estudiante_id}`, payloadEstudiante);
                await api.patch(`/movilidades/${modoEdicion.id}`, payloadMovilidad);
                mostrarAviso('Datos del estudiante actualizados correctamente.');
            } else {
                const resEst = await api.post('/estudiantes', payloadEstudiante);
                const nuevoEstudianteId = resEst.data.id_insertado;

                try {
                    await api.post('/movilidades', {
                        ...payloadMovilidad,
                        estudiante_id: nuevoEstudianteId
                    });
                } catch (errMov) {
                    // Si fallara la movilidad por algún motivo, revertimos el estudiante para no dejar huérfanos
                    await api.delete(`/estudiantes/${nuevoEstudianteId}`).catch(() => {});
                    throw errMov;
                }

                mostrarAviso('Estudiante agregado. Se generaron sus 14 documentos automáticamente.');
            }

            setModalFormulario(false);
            await cargarTodo();
        } catch (err) {
            setErrorForm(err.response?.data?.mensaje || 'No se pudo guardar la información.');
        } finally {
            setGuardandoForm(false);
        }
    };

    const eliminarEstudianteActual = async () => {
        if (!modoEdicion) return;
        const confirmar = window.confirm(
            `¿Seguro que deseas eliminar a ${modoEdicion.nombres} ${modoEdicion.apellido_paterno} y todos sus documentos?`
        );
        if (!confirmar) return;

        try {
            setGuardandoForm(true);
            await api.delete(`/estudiantes/${modoEdicion.estudiante_id}`);
            setModalFormulario(false);
            await cargarTodo();
            mostrarAviso('Estudiante y expediente eliminados.');
        } catch (err) {
            setErrorForm(err.response?.data?.mensaje || 'No se pudo eliminar el registro.');
        } finally {
            setGuardandoForm(false);
        }
    };

    const registrarMonitoreo = async (e) => {
        e.preventDefault();
        if (!filaMonitoreo) return;
        setErrorMonitoreo('');
        try {
            setGuardandoForm(true);
            await api.post('/monitoreos', {
                movilidad_id: filaMonitoreo.id,
                ...formMonitoreo
            });
            setFormMonitoreo({
                fecha_registro: hoyISO(),
                estado_estudiante: 'Sin novedades',
                medio_contacto: 'WhatsApp',
                responsable: '',
                observaciones: ''
            });
            await cargarMonitoreosDeFila(filaMonitoreo.id);
            await cargarTodo();
            mostrarAviso('Monitoreo quincenal registrado.');
        } catch (err) {
            setErrorMonitoreo(err.response?.data?.mensaje || 'Error al registrar monitoreo.');
        } finally {
            setGuardandoForm(false);
        }
    };

    const irAFilaEstudiante = (movilidadId) => {
        setModalAlertas(false);
        setFilaResaltada(movilidadId);
        const el = document.getElementById(`fila-movilidad-${movilidadId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => setFilaResaltada(null), 3200);
    };

    const completosCount = filas.filter((f) => f.expediente_completo).length;

    return (
        <div className="matrix-app">
            {/* Input oculto para carga de PDFs */}
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                style={{ display: 'none' }}
                onChange={onFileChange}
            />

            {/* Toast / Aviso flotante minimalista */}
            {avisoGlobal && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '24px',
                        zIndex: 150,
                        background: avisoGlobal.tipo === 'error' ? '#DC2626' : '#3363AC',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                >
                    {avisoGlobal.texto}
                </div>
            )}

            {/* =========================================
                FILA 0: CABECERA SUPERIOR FIJA
            ========================================= */}
            <div className="matrix-header-row">
                <aside className="sidebar-cell sidebar-cell--header">
                    <div className="sidebar-search">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2">
                            <circle cx="11" cy="11" r="7" />
                            <path d="M20 20l-3.5-3.5" />
                        </svg>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar estudiante o DNI..."
                            aria-label="Buscar estudiante"
                        />
                        {busqueda && (
                            <button
                                type="button"
                                className="sidebar-search-clear"
                                onClick={() => setBusqueda('')}
                                title="Limpiar búsqueda"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </aside>

                <div className="main-cell--header">
                    <header className="main-header">
                        <div className="header-summary">
                            <span className="header-pill">
                                ESTUDIANTES: {cargando ? '...' : filas.length}
                            </span>
                            <span className="header-pill">
                                EXPEDIENTES COMPLETOS: {cargando ? '...' : `${completosCount}/${filas.length}`}
                            </span>
                        </div>

                        <div className="header-actions">
                            <button
                                type="button"
                                className="header-button"
                                onClick={abrirModalNuevo}
                            >
                                + NUEVO ESTUDIANTE
                            </button>

                            {/* BOTÓN DE ALERTAS (NOTIFICACIONES) */}
                            <button
                                type="button"
                                className="header-button"
                                onClick={() => setModalAlertas(true)}
                                aria-label="Abrir alertas de seguimiento"
                            >
                                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                ALERTAS
                                <span className={`alert-badge ${alertas.length === 0 ? 'alert-badge--ok' : ''}`}>
                                    {alertas.length}
                                </span>
                            </button>

                            {/* BOTÓN EXPORTAR EXCEL */}
                            <a
                                href={URL_EXPORT}
                                download
                                className="export-button"
                            >
                                EXPORTAR EXCEL
                            </a>
                        </div>
                    </header>
                </div>
            </div>

            {/* =========================================
                CONTENEDOR PRINCIPAL CON SCROLL VERTICAL MINIMALISTA
                Filas sincronizadas automáticamente por CSS Grid 1:1
            ========================================= */}
            <div className="matrix-scroll-body">
                {cargando ? (
                    // Skeletons de carga elegantes para evitar saltos o parpadeos bruscos al recargar
                    Array.from({ length: 3 }).map((_, idx) => (
                        <div key={`skeleton-${idx}`} className="matrix-row matrix-row--skeleton">
                            <aside className="sidebar-cell">
                                <div className="skeleton-card" />
                            </aside>
                            <main className="main-cell">
                                <div className="skeleton-document-section" />
                            </main>
                        </div>
                    ))
                ) : (
                    <>
                        {filasFiltradas.map((fila) => {
                            const documentos = fila.documentos || [];
                            const entregados = Number(fila.documentos_entregados || 0);
                            const total = Number(fila.documentos_total || 14);
                            const completo = Boolean(fila.expediente_completo);
                            const nombreCompleto = `${fila.nombres} ${fila.apellido_paterno} ${fila.apellido_materno}`;

                            return (
                                <div
                                    key={fila.id}
                                    id={`fila-movilidad-${fila.id}`}
                                    className="matrix-row"
                                >
                                    {/* COLUMNA IZQUIERDA: PERFIL DEL ESTUDIANTE */}
                                    <aside className="sidebar-cell">
                                        <article
                                            className={`profile-card ${filaResaltada === fila.id ? 'profile-card--highlighted' : ''}`}
                                        >
                                            <div className="profile-info">
                                                <div className="profile-header">
                                                    <h2 title={nombreCompleto}>{nombreCompleto}</h2>
                                                </div>

                                                <div className="profile-columns">
                                                    {/* Columna 1: Datos del Estudiante */}
                                                    <dl className="profile-details">
                                                        <div>
                                                            <dt>DNI:</dt>
                                                            <dd>{fila.dni}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Código:</dt>
                                                            <dd>{fila.codigo_estudiante}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Semestre:</dt>
                                                            <dd>{NOMBRES_SEMESTRE[String(fila.semestre)] || `${fila.semestre}.º`}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Fac. Origen:</dt>
                                                            <dd title={`${fila.facultad_origen || ''}${fila.escuela_profesional ? ` - ${fila.escuela_profesional}` : ''}`}>
                                                                {fila.facultad_origen || '—'}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt>Correo Inst.:</dt>
                                                            <dd title={fila.correo_institucional}>{fila.correo_institucional}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Correo Pers.:</dt>
                                                            <dd title={fila.correo_personal}>{fila.correo_personal}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Celular:</dt>
                                                            <dd>{fila.telefono_whatsapp || '—'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Cel. Padre:</dt>
                                                            <dd>{fila.contacto_emergencia || '—'}</dd>
                                                        </div>
                                                    </dl>

                                                    {/* Columna 2: Datos de Movilidad y Destino */}
                                                    <dl className="profile-details profile-details--right">
                                                        <div>
                                                            <dt>Univ. Destino:</dt>
                                                            <dd title={fila.universidad_destino}>{fila.universidad_destino || '—'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Fac. Destino:</dt>
                                                            <dd title={fila.facultad_destino}>{fila.facultad_destino || '—'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>País / Ciudad:</dt>
                                                            <dd title={`${fila.ciudad_destino || ''}, ${fila.pais_destino || ''}`}>
                                                                {fila.pais_destino || '—'}{fila.ciudad_destino && fila.ciudad_destino !== 'Por definir' ? ` (${fila.ciudad_destino})` : ''}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt>Dirección:</dt>
                                                            <dd title={fila.direccion_residencia}>{fila.direccion_residencia || '—'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Salida:</dt>
                                                            <dd>{formatearFecha(fila.fecha_salida)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Retorno:</dt>
                                                            <dd>{formatearFecha(fila.fecha_retorno)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Estado:</dt>
                                                            <dd>{fila.estado || '—'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Postulado:</dt>
                                                            <dd>{fila.postulado ? 'SÍ' : 'NO'}</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                            </div>

                                            <div className="profile-actions">
                                                <button
                                                    className="edit-button"
                                                    type="button"
                                                    onClick={() => abrirModalEditar(fila)}
                                                    aria-label={`Editar perfil de ${nombreCompleto}`}
                                                    title="Editar estudiante y destino"
                                                >
                                                    <IconoLapiz />
                                                </button>
                                                <button
                                                    className="monitor-button"
                                                    type="button"
                                                    onClick={() => abrirModalMonitoreo(fila)}
                                                    aria-label={`Monitoreo quincenal de ${nombreCompleto}`}
                                                    title="Monitoreo quincenal (cada 15 días)"
                                                >
                                                    <IconoMonitoreo />
                                                    {fila.monitoreo_vencido && <span className="monitor-dot" title="Monitoreo vencido" />}
                                                </button>
                                            </div>
                                        </article>
                                    </aside>

                                    {/* COLUMNA DERECHA: LOS 14 DOCUMENT ITEMS */}
                                    <main className="main-cell">
                                        <section
                                            className="document-section"
                                            aria-label={`Documentación de ${nombreCompleto}`}
                                        >
                                            <div className="document-section-header">
                                                <span />
                                                <span
                                                    className={`doc-progress-badge ${completo ? 'doc-progress-badge--complete' : ''}`}
                                                    title={completo ? '14 de 14 documentos entregados' : `${entregados} documentos entregados de ${total}`}
                                                >
                                                    {completo ? 'EXPEDIENTE COMPLETO · 14/14' : `${entregados} / ${total} ENTREGADOS`}
                                                </span>
                                            </div>

                                            <div className="document-grid">
                                                {documentos.map((doc) => {
                                                    const adjunto = doc.estado_entrega === 'Entregado';
                                                    const clave = `${fila.id}-${doc.tipo_documento}`;
                                                    const estaSubiendo = subiendoClave === clave;
                                                    const tituloCorto = ETIQUETAS_CORTAS_DOC[doc.tipo_documento] || doc.nombre.toUpperCase();

                                                    return (
                                                        <article key={doc.tipo_documento} className="document-item">
                                                            <h3 title={doc.nombre}>{tituloCorto}</h3>

                                                            <div
                                                                className="document-dropzone-wrapper"
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    const archivo = e.dataTransfer?.files?.[0];
                                                                    if (archivo) {
                                                                        subirArchivoPdf(fila.id, doc.tipo_documento, archivo);
                                                                    }
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className={`document-dropzone ${adjunto ? 'document-dropzone--attached' : ''}`}
                                                                    onClick={() => manejarClickDropzone(fila.id, doc)}
                                                                    disabled={estaSubiendo}
                                                                    title={
                                                                        adjunto
                                                                            ? `${doc.nombre}: Adjuntado. Clic para abrir el PDF.`
                                                                            : `${doc.nombre}: Pendiente. Clic o arrastra un PDF aquí para adjuntar.`
                                                                    }
                                                                >
                                                                    {adjunto ? <IconoArchivoCheck /> : <IconoArchivoMas />}
                                                                    <span
                                                                        className={`doc-status-pill ${adjunto ? 'doc-status-pill--si' : 'doc-status-pill--no'}`}
                                                                    >
                                                                        {estaSubiendo ? '...' : adjunto ? 'ADJUNTADO' : 'PENDIENTE'}
                                                                    </span>
                                                                </button>

                                                                {adjunto && !estaSubiendo && (
                                                                    <div className="doc-quick-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="doc-action-btn doc-action-btn--replace"
                                                                            title="Reemplazar archivo PDF"
                                                                            aria-label="Reemplazar archivo PDF"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                abrirSelectorPdf(fila.id, doc.tipo_documento);
                                                                            }}
                                                                        >
                                                                            <IconoReemplazar />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="doc-action-btn doc-action-btn--delete"
                                                                            title="Quitar archivo PDF"
                                                                            aria-label="Quitar archivo PDF"
                                                                            onClick={(e) => quitarDocumentoPdf(e, fila.id, doc.tipo_documento)}
                                                                        >
                                                                            <IconoPapelera />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    </main>
                                </div>
                            );
                        })}

                        {/* ÚNICA FILA PARA AGREGAR NUEVO ESTUDIANTE (+) */}
                        <div className="matrix-row">
                            <aside className="sidebar-cell">
                                <button
                                    className="photo-upload"
                                    type="button"
                                    onClick={abrirModalNuevo}
                                    aria-label="Agregar nuevo estudiante"
                                    title="Haz clic para agregar un nuevo estudiante"
                                >
                                    <span className="add-student-icon">
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M12 5v14M5 12h14" />
                                        </svg>
                                    </span>
                                    <span className="photo-upload-label">Agregar estudiante</span>
                                </button>
                            </aside>

                            <div className="main-cell">
                                <div className="workspace-band">
                                    Al agregar un estudiante en (+), sus 14 documentos se generarán automáticamente en esta fila
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* =========================================
                MODAL: AGREGAR / EDITAR ESTUDIANTE Y DESTINO
            ========================================= */}
            {modalFormulario && (
                <div className="modal-backdrop" onClick={() => setModalFormulario(false)}>
                    <div
                        className="modal-card modal-card--wide"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h2>
                                    {modoEdicion
                                        ? `EDITAR ESTUDIANTE: ${modoEdicion.nombres} ${modoEdicion.apellido_paterno}`
                                        : 'AGREGAR NUEVO ESTUDIANTE'}
                                </h2>
                                <p>
                                    {modoEdicion
                                        ? 'Actualiza los datos del perfil del estudiante y su destino de movilidad.'
                                        : 'Al guardar el estudiante se generará automáticamente su expediente con los 14 ítems de documentos.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setModalFormulario(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={guardarEstudianteYMovilidad} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div className="modal-body">
                                {errorForm && (
                                    <div
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: '1px solid #FECACA',
                                            background: '#FEF2F2',
                                            color: '#DC2626',
                                            fontSize: '12.5px',
                                            fontWeight: 700
                                        }}
                                    >
                                        {errorForm}
                                    </div>
                                )}

                                    <div className="form-section-title">1. Perfil del Estudiante</div>

                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label htmlFor="dni">DNI (8 dígitos) *</label>
                                            <input
                                                id="dni"
                                                name="dni"
                                                required
                                                maxLength={8}
                                                pattern="\d{8}"
                                                inputMode="numeric"
                                                placeholder="Ej: 75186439"
                                                value={formData.dni}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="codigo_estudiante">Código Estudiante *</label>
                                            <input
                                                id="codigo_estudiante"
                                                name="codigo_estudiante"
                                                required
                                                placeholder="Ej: 2022200420G"
                                                value={formData.codigo_estudiante}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="semestre">Semestre *</label>
                                            <select
                                                id="semestre"
                                                name="semestre"
                                                required
                                                value={formData.semestre}
                                                onChange={handleFormChange}
                                            >
                                                {SEMESTRES.map((sem) => (
                                                    <option key={sem} value={sem}>
                                                        {NOMBRES_SEMESTRE[sem]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="nombres">Nombres *</label>
                                            <input
                                                id="nombres"
                                                name="nombres"
                                                required
                                                placeholder="Nombres del estudiante"
                                                value={formData.nombres}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="apellido_paterno">Apellido Paterno *</label>
                                            <input
                                                id="apellido_paterno"
                                                name="apellido_paterno"
                                                required
                                                placeholder="Apellido paterno"
                                                value={formData.apellido_paterno}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="apellido_materno">Apellido Materno *</label>
                                            <input
                                                id="apellido_materno"
                                                name="apellido_materno"
                                                required
                                                placeholder="Apellido materno"
                                                value={formData.apellido_materno}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="correo_institucional">Correo Institucional *</label>
                                            <input
                                                id="correo_institucional"
                                                name="correo_institucional"
                                                type="email"
                                                required
                                                placeholder="e_codigo@uncp.edu.pe"
                                                value={formData.correo_institucional}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="correo_personal">Correo Personal *</label>
                                            <input
                                                id="correo_personal"
                                                name="correo_personal"
                                                type="email"
                                                required
                                                placeholder="correo@ejemplo.com"
                                                value={formData.correo_personal}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="telefono_whatsapp">Celular</label>
                                            <input
                                                id="telefono_whatsapp"
                                                name="telefono_whatsapp"
                                                placeholder="Ej: 987654321"
                                                value={formData.telefono_whatsapp}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="contacto_emergencia">Celular Padre / Emergencia</label>
                                            <input
                                                id="contacto_emergencia"
                                                name="contacto_emergencia"
                                                placeholder="Ej: 999888777 (Padre/Madre)"
                                                value={formData.contacto_emergencia}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="facultad_origen">Facultad de Origen (UNCP)</label>
                                            <input
                                                id="facultad_origen"
                                                name="facultad_origen"
                                                placeholder="Ej: Ingeniería de Sistemas"
                                                value={formData.facultad_origen}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="escuela_profesional">Escuela Profesional</label>
                                            <input
                                                id="escuela_profesional"
                                                name="escuela_profesional"
                                                placeholder="Escuela profesional"
                                                value={formData.escuela_profesional}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-section-title">2. Datos de Movilidad y Destino</div>

                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label htmlFor="universidad_destino">Universidad de Destino</label>
                                            <input
                                                id="universidad_destino"
                                                name="universidad_destino"
                                                placeholder="Universidad receptora"
                                                value={formData.universidad_destino}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="facultad_destino">Facultad de Destino</label>
                                            <input
                                                id="facultad_destino"
                                                name="facultad_destino"
                                                placeholder="Facultad receptora"
                                                value={formData.facultad_destino}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="pais_destino">País de Destino</label>
                                            <input
                                                id="pais_destino"
                                                name="pais_destino"
                                                placeholder="Ej: España, México, Colombia..."
                                                value={formData.pais_destino}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="ciudad_destino">Ciudad de Destino</label>
                                            <input
                                                id="ciudad_destino"
                                                name="ciudad_destino"
                                                placeholder="Ciudad"
                                                value={formData.ciudad_destino}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="fecha_salida">Fecha de Salida</label>
                                            <input
                                                id="fecha_salida"
                                                name="fecha_salida"
                                                type="date"
                                                value={formData.fecha_salida}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="fecha_retorno">Fecha de Retorno</label>
                                            <input
                                                id="fecha_retorno"
                                                name="fecha_retorno"
                                                type="date"
                                                value={formData.fecha_retorno}
                                                onChange={handleFormChange}
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="estado">Estado de Movilidad</label>
                                            <select
                                                id="estado"
                                                name="estado"
                                                value={formData.estado}
                                                onChange={handleFormChange}
                                            >
                                                {ESTADOS_MOVILIDAD.map((est) => (
                                                    <option key={est} value={est}>{est}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="postulado">Postulado</label>
                                            <select
                                                id="postulado"
                                                name="postulado"
                                                value={formData.postulado ? 'si' : 'no'}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({ ...prev, postulado: e.target.value === 'si' }))
                                                }
                                            >
                                                <option value="si">SÍ</option>
                                                <option value="no">NO</option>
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="direccion_residencia">Dirección de Residencia en Destino</label>
                                            <input
                                                id="direccion_residencia"
                                                name="direccion_residencia"
                                                placeholder="Calle, número y ciudad en el extranjero"
                                                value={formData.direccion_residencia}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <div>
                                        {modoEdicion && (
                                            <button
                                                type="button"
                                                className="btn-danger"
                                                onClick={eliminarEstudianteActual}
                                                disabled={guardandoForm}
                                            >
                                                ELIMINAR ESTUDIANTE
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setModalFormulario(false)}
                                        >
                                            CANCELAR
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={guardandoForm}
                                        >
                                            {guardandoForm
                                                ? 'GUARDANDO...'
                                                : modoEdicion
                                                    ? 'GUARDAR CAMBIOS'
                                                    : 'CREAR ESTUDIANTE'}
                                        </button>
                                    </div>
                                </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL INDEPENDIENTE: MONITOREO QUINCENAL
            ========================================= */}
            {filaMonitoreo && (
                <div className="modal-backdrop" onClick={() => setFilaMonitoreo(null)}>
                    <div
                        className="modal-card modal-card--wide"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h2>
                                    MONITOREO QUINCENAL: {filaMonitoreo.nombres} {filaMonitoreo.apellido_paterno}
                                </h2>
                                <p>
                                    Seguimiento cada 15 días · Próximo monitoreo programado: {formatearFecha(filaMonitoreo.proximo_monitoreo)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setFilaMonitoreo(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            {errorMonitoreo && (
                                <div
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #FECACA',
                                        background: '#FEF2F2',
                                        color: '#DC2626',
                                        fontSize: '12.5px',
                                        fontWeight: 700
                                    }}
                                >
                                    {errorMonitoreo}
                                </div>
                            )}

                            <form onSubmit={registrarMonitoreo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="form-section-title">
                                    Registrar Seguimiento Quincenal (Cada 15 días)
                                </div>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label>Fecha de Contacto *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formMonitoreo.fecha_registro}
                                            onChange={(e) =>
                                                setFormMonitoreo((p) => ({ ...p, fecha_registro: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Situación del Estudiante *</label>
                                        <select
                                            value={formMonitoreo.estado_estudiante}
                                            onChange={(e) =>
                                                setFormMonitoreo((p) => ({ ...p, estado_estudiante: e.target.value }))
                                            }
                                        >
                                            {ESTADOS_MONITOREO.map((est) => (
                                                <option key={est} value={est}>{est}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label>Medio de Contacto</label>
                                        <select
                                            value={formMonitoreo.medio_contacto}
                                            onChange={(e) =>
                                                setFormMonitoreo((p) => ({ ...p, medio_contacto: e.target.value }))
                                            }
                                        >
                                            {MEDIOS_CONTACTO.map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-field form-field--span-2">
                                        <label>Observaciones del contacto</label>
                                        <input
                                            placeholder="Detalle del seguimiento quincenal..."
                                            value={formMonitoreo.observaciones}
                                            onChange={(e) =>
                                                setFormMonitoreo((p) => ({ ...p, observaciones: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="form-field" style={{ justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn-primary" disabled={guardandoForm}>
                                            + REGISTRAR MONITOREO
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div className="form-section-title" style={{ marginTop: '8px' }}>
                                Historial de Monitoreos Realizados ({monitoreos.length})
                            </div>

                            {cargandoMonitoreos ? (
                                <p style={{ fontSize: '12px' }}>Cargando historial...</p>
                            ) : monitoreos.length === 0 ? (
                                <p style={{ fontSize: '12.5px', color: '#64748B' }}>
                                    Aún no se han registrado monitoreos quincenales para este estudiante.
                                </p>
                            ) : (
                                <div className="alert-list">
                                    {monitoreos.map((mon) => (
                                        <div key={mon.id} className="alert-item">
                                            <div className="alert-item-top">
                                                <strong>
                                                    Fecha: {formatearFecha(mon.fecha_registro)} — {mon.estado_estudiante}
                                                </strong>
                                                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#3363AC' }}>
                                                    Medio: {mon.medio_contacto || '—'} · Próximo: {formatearFecha(mon.proxima_fecha)}
                                                </span>
                                            </div>
                                            {mon.observaciones && (
                                                <p style={{ fontSize: '12px' }}>{mon.observaciones}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <span style={{ fontSize: '12px', color: '#64748B' }}>
                                Total de registros: {monitoreos.length}
                            </span>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setFilaMonitoreo(null)}
                            >
                                CERRAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                MODAL DE ALERTAS Y SEGUIMIENTO (NOTIFICACIONES)
            ========================================= */}
            {modalAlertas && (
                <div className="modal-backdrop" onClick={() => setModalAlertas(false)}>
                    <div
                        className="modal-card modal-card--wide"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <h2>CENTRO DE ALERTAS Y SEGUIMIENTO</h2>
                                <p>
                                    Listado de estudiantes con documentos pendientes o monitoreo quincenal vencido.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setModalAlertas(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            {alertas.length === 0 ? (
                                <div
                                    style={{
                                        padding: '28px',
                                        textAlign: 'center',
                                        background: '#F8FAFC',
                                        borderRadius: '12px',
                                        border: '1px solid #E2E8F0',
                                        fontWeight: 700
                                    }}
                                >
                                    {filas.length === 0
                                        ? 'No hay estudiantes registrados todavía.'
                                        : '¡Todo al día! Todos los expedientes están completos y sin monitoreos vencidos.'}
                                </div>
                            ) : (
                                <div className="alert-list">
                                    {alertas.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`alert-item ${item.urgente ? 'alert-item--urgent' : ''}`}
                                        >
                                            <div className="alert-item-top">
                                                <div>
                                                    <strong style={{ fontSize: '14px' }}>
                                                        {item.nombreCompleto}
                                                    </strong>
                                                    <span style={{ fontSize: '12px', marginLeft: '8px', color: '#475569' }}>
                                                        DNI {item.dni} · Estado: {item.estado}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            padding: '3px 8px',
                                                            borderRadius: '6px',
                                                            background: item.expedienteCompleto ? '#10B981' : '#3363AC',
                                                            color: '#FFFFFF'
                                                        }}
                                                    >
                                                        DOCUMENTOS: {item.entregadosCount}/{item.totalCount}
                                                    </span>

                                                    {item.monitoreoVencido && (
                                                        <span
                                                            style={{
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                padding: '3px 8px',
                                                                borderRadius: '6px',
                                                                background: '#DC2626',
                                                                color: '#FFFFFF'
                                                            }}
                                                        >
                                                            MONITOREO VENCIDO ({formatearFecha(item.proximoMonitoreo)})
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="btn-secondary"
                                                        style={{ height: '30px', padding: '0 10px', fontSize: '11px' }}
                                                        onClick={() => irAFilaEstudiante(item.id)}
                                                    >
                                                        IR A SU FILA
                                                    </button>
                                                </div>
                                            </div>

                                            {item.pendientes.length > 0 && (
                                                <div>
                                                    <p style={{ fontSize: '11px', fontWeight: 700, marginBottom: '5px', color: '#364153' }}>
                                                        DOCUMENTOS PENDIENTES ({item.pendientes.length}):
                                                    </p>
                                                    <div className="alert-tags">
                                                        {item.pendientes.map((doc) => (
                                                            <span key={doc.tipo_documento} className="alert-tag">
                                                                {ETIQUETAS_CORTAS_DOC[doc.tipo_documento] || doc.nombre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {item.entregados.length > 0 && (
                                                <div>
                                                    <p style={{ fontSize: '11px', fontWeight: 700, marginBottom: '5px', color: '#3363AC' }}>
                                                        DOCUMENTOS ENTREGADOS ({item.entregados.length}):
                                                    </p>
                                                    <div className="alert-tags">
                                                        {item.entregados.map((doc) => (
                                                            <span key={doc.tipo_documento} className="alert-tag alert-tag--si">
                                                                {ETIQUETAS_CORTAS_DOC[doc.tipo_documento] || doc.nombre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>
                                Total de alertas activas: {alertas.length}
                            </span>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setModalAlertas(false)}
                            >
                                CERRAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
