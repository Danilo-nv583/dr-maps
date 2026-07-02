import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase/supabase';
import Login from './components/Login';
import jsPDF from 'jspdf';
import Dashboard from './components/Dashboard';
import HistorialModal from './components/HistorialModal';
import BuscadorLote from './components/BuscadorLote';
import MapaLotes from './components/MapaLotes';
import ModalLote from './components/ModalLote';




const proyectosIniciales = [
  {
    id: 'el-tejar',
    nombre: 'Lotificación El Tejar',
    imagen: 'mapa-el-tejar.png',
  },
];

function App() {
  const svgRef = useRef(null);
  const importInputRef = useRef(null);
  const cargandoDesdeNubeRef = useRef(false);
  const temporizadorGuardadoRef = useRef(null);
  const inicioAutoGuardadoRef = useRef(false);

  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
const [historial, setHistorial] = useState([]);

  const [proyectos, setProyectos] = useState(proyectosIniciales);

  const [proyectoActualId, setProyectoActualId] = useState(() => {
    return localStorage.getItem('drmaps-proyecto-actual') || 'el-tejar';
  });

  const proyectoActual =
  
    proyectos.find((p) => p.id === proyectoActualId) || proyectos[0];

  const storageKey = `drmaps-lotes-${proyectoActual.id}`;

  

  const [modoEditor, setModoEditor] = useState(false);
  const [puntosNuevoLote, setPuntosNuevoLote] = useState([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [puntoArrastrando, setPuntoArrastrando] = useState(null);
  const [lotes, setLotes] = useState(() => {
    const guardados = localStorage.getItem(storageKey);
    return guardados ? JSON.parse(guardados) : [];
  });
  const [contador, setContador] = useState(1);

  const [busquedaLote, setBusquedaLote] = useState('');
  const [zoomMapa, setZoomMapa] = useState(1);

  const totalLotes = lotes.length;

const libres = lotes.filter(
  (lote) => lote.estado === 'libre'
).length;

const reservados = lotes.filter(
  (lote) => lote.estado === 'reservado'
).length;

const vendidos = lotes.filter(
  (lote) => lote.estado === 'vendido'
).length;

function buscarLote() {
  const numero = Number(busquedaLote);

  if (!numero) {
    alert('Escribe un número de lote.');
    return;
  }

  const lote = lotes.find((l) => l.numero === numero);

  if (!lote) {
    alert('No se encontró ese lote.');
    return;
  }

  setLoteSeleccionado(lote);
}



const valorDisponible = lotes
  .filter((lote) => lote.estado === 'libre')
  .reduce(
    (total, lote) =>
      total +
      Number(
        String(lote.precio).replace(/[^\d]/g, '') || 0
      ),
    0
  );

const areaDisponible = lotes
  .filter((lote) => lote.estado === 'libre')
  .reduce(
    (total, lote) =>
      total +
      Number(
        String(lote.area).replace(/[^\d.]/g, '') || 0
      ),
    0
  );

  const rol = perfil?.rol || 'cliente';
  const esAdmin = rol === 'admin';
  const esVendedor = rol === 'vendedor';
  const puedeEditarTodo = esAdmin;
  const puedeCambiarEstado = esAdmin || esVendedor;

  useEffect(() => {
    async function verificarSesion() {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        setUsuario(data.session.user);

        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        setPerfil(perfilData);
      }
    }

    verificarSesion();
  }, []);

  useEffect(() => {
    localStorage.setItem('drmaps-proyectos', JSON.stringify(proyectos));
  }, [proyectos]);

  useEffect(() => {
    localStorage.setItem('drmaps-proyecto-actual', proyectoActualId);
  }, [proyectoActualId]);

  useEffect(() => {
    const nuevosLotes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setLotes(nuevosLotes);
    setContador(
      nuevosLotes.length > 0
        ? Math.max(...nuevosLotes.map((l) => l.numero)) + 1
        : 1
    );
    setLoteSeleccionado(null);
    setPuntosNuevoLote([]);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lotes));
  }, [lotes, storageKey]);

  useEffect(() => {
    cargarDesdeSupabase(false);
  }, [proyectoActual.id]);

  useEffect(() => {
    const canal = supabase
      .channel(`lotes-${proyectoActual.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lotes',
        },
        () => {
          cargarDesdeSupabase(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [proyectoActual.id]);

  useEffect(() => {
    if (!puedeCambiarEstado) return;

    if (!inicioAutoGuardadoRef.current) {
      inicioAutoGuardadoRef.current = true;
      return;
    }

    if (cargandoDesdeNubeRef.current) return;

    clearTimeout(temporizadorGuardadoRef.current);

    temporizadorGuardadoRef.current = setTimeout(() => {
      guardarEnSupabase(false);
    }, 1000);

    return () => {
      clearTimeout(temporizadorGuardadoRef.current);
    };
  }, [lotes]);

  async function obtenerProyectoSupabase(crearSiNoExiste = false) {
    const { data: existente } = await supabase
      .from('proyectos')
      .select('*')
      .eq('nombre', proyectoActual.nombre)
      .maybeSingle();

    if (existente) return existente;

    if (!crearSiNoExiste) return null;

    const { data: nuevo, error } = await supabase
      .from('proyectos')
      .insert({
        nombre: proyectoActual.nombre,
        imagen: proyectoActual.imagen,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert('Error creando proyecto en Supabase.');
      return null;
    }

    return nuevo;
  }

  async function guardarEnSupabase(mostrarAlerta = true) {
    if (!puedeCambiarEstado) return;

    const proyecto = await obtenerProyectoSupabase(true);
    if (!proyecto) return;

    await supabase.from('lotes').delete().eq('proyecto_id', proyecto.id);

    if (lotes.length === 0) {
      if (mostrarAlerta) alert('No hay lotes para guardar.');
      return;
    }

    const lotesParaGuardar = lotes.map((lote) => ({
      proyecto_id: proyecto.id,
      numero: lote.numero,
      estado: lote.estado,
      puntos: lote.puntos,
      area: lote.area || '',
      precio: lote.precio || '',
      asesor: lote.asesor || '',
      telefono: lote.telefono || '',
      observaciones: lote.observaciones || '',
      fecha_reserva: lote.fecha_reserva || '',
      asesores: lote.asesores || [],
    }));

    const { error } = await supabase.from('lotes').insert(lotesParaGuardar);

    if (error) {
      console.error(error);
      if (mostrarAlerta) alert('Error guardando lotes en Supabase.');
      return;
    }

    if (mostrarAlerta) {
      alert('Lotes guardados en Supabase correctamente.');
    }
  }

  async function cargarDesdeSupabase(mostrarAlerta = true) {
    const proyecto = await obtenerProyectoSupabase(false);
    if (!proyecto) return;

    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('proyecto_id', proyecto.id)
      .order('numero', { ascending: true });

    if (error) {
      console.error(error);
      if (mostrarAlerta) alert('Error cargando lotes desde Supabase.');
      return;
    }

    const lotesCargados = data.map((lote) => ({
      numero: lote.numero,
      estado: lote.estado,
      puntos: lote.puntos,
      area: lote.area || '',
      precio: lote.precio || '',
      asesor: lote.asesor || '',
      telefono: lote.telefono || '',
      observaciones: lote.observaciones || '',
      fecha_reserva: lote.fecha_reserva || '',
      asesores: lote.asesores || [],
    }));

    cargandoDesdeNubeRef.current = true;

    setLotes(lotesCargados);
    setContador(
      lotesCargados.length > 0
        ? Math.max(...lotesCargados.map((l) => l.numero)) + 1
        : 1
    );

    setLoteSeleccionado((actual) => {
      if (!actual) return null;

     const actualizado = lotesCargados.find(
        (lote) => lote.numero === actual.numero
    );

    return actualizado || actual;
  });

    setPuntosNuevoLote([]);

    setTimeout(() => {
      cargandoDesdeNubeRef.current = false;
    }, 1000);

    if (mostrarAlerta) {
      alert('Lotes cargados desde Supabase correctamente.');
    }
  }

  function crearProyecto() {
    if (!esAdmin) return;

    const nombre = prompt('Nombre del nuevo proyecto:');
    if (!nombre) return;

    const imagen = prompt(
      'Nombre exacto de la imagen dentro de public. Ejemplo: mapa-los-pinos.jpeg'
    );
    if (!imagen) return;

    const id = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setProyectos([...proyectos, { id, nombre, imagen }]);
    setProyectoActualId(id);
  }

  function eliminarProyecto() {
    if (!esAdmin) return;

    if (proyectos.length === 1) {
      alert('Debe existir al menos un proyecto.');
      return;
    }

    if (confirm(`¿Eliminar el proyecto "${proyectoActual.nombre}"?`)) {
      localStorage.removeItem(`drmaps-lotes-${proyectoActual.id}`);
      const restantes = proyectos.filter((p) => p.id !== proyectoActual.id);
      setProyectos(restantes);
      setProyectoActualId(restantes[0].id);
    }
  }

  function colorEstado(estado) {
    if (estado === 'libre') return 'rgba(46, 204, 113, 0.6)';
    if (estado === 'reservado') return 'rgba(241, 196, 15, 0.75)';
    if (estado === 'vendido') return 'rgba(231, 76, 60, 0.75)';
    return 'rgba(200,200,200,0.7)';
  }

  function obtenerPosicion(event) {
    const svg = svgRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - svg.left) / svg.width) * 100,
      y: ((event.clientY - svg.top) / svg.height) * 100,
    };
  }

  function agregarPunto(event) {
    if (!modoEditor || !puedeEditarTodo) return;
    if (event.target.tagName !== 'svg') return;

    setPuntosNuevoLote([...puntosNuevoLote, obtenerPosicion(event)]);
  }

  function finalizarLote() {
    if (!puedeEditarTodo) return;

    if (puntosNuevoLote.length < 3) {
      alert('Necesitas mínimo 3 puntos para crear un lote.');
      return;
    }

    const nuevo = {
      numero: contador,
      estado: 'libre',
      puntos: puntosNuevoLote,
      area: '',
      precio: '',
      asesor: '',
      telefono: '',
      observaciones: '',
      fecha_reserva: '',
      asesores: [],
    };

    setLotes([...lotes, nuevo]);
    setContador(contador + 1);
    setPuntosNuevoLote([]);
    setLoteSeleccionado(nuevo);
  }

  async function guardarHistorial(lote, campo, valorAnterior, valorNuevo) {
  if (!usuario) return;
  if (String(valorAnterior) === String(valorNuevo)) return;

  const proyecto = await obtenerProyectoSupabase(false);
  if (!proyecto) return;

  await supabase.from('historial_cambios').insert({
    proyecto_id: proyecto.id,
    lote_numero: lote.numero,
    usuario: perfil?.nombre || usuario.email || 'Usuario',
    rol: rol,
    campo: campo,
    valor_anterior: String(valorAnterior ?? ''),
    valor_nuevo: String(valorNuevo ?? ''),
  });
}

  function actualizarLote(numeroOriginal, campo, valor) {
  if (campo !== 'estado' && !puedeEditarTodo) return;
  if (campo === 'estado' && !puedeCambiarEstado) return;

  const valorFinal =
    campo === 'estado' ||
    campo === 'area' ||
    campo === 'precio' ||
    campo === 'asesor' ||
    campo === 'telefono' ||
    campo === 'observaciones' ||
    campo === 'fecha_reserva' ||
    campo === 'asesores'
      ? valor
      : Number(valor);

  const nuevosLotes = lotes.map((lote) => {
    if (lote.numero !== numeroOriginal) return lote;

    const actualizado = {
      ...lote,
      [campo]: valorFinal,
    };

    if (campo === 'estado' && valorFinal === 'libre') {
      actualizado.fecha_reserva = '';

      guardarHistorial(
        lote,
        'fecha_reserva',
        lote.fecha_reserva,
        ''
);
    }

    if (
      campo === 'estado' &&
      valorFinal === 'reservado' &&
      !lote.fecha_reserva
    ) {
      actualizado.fecha_reserva = new Date().toLocaleDateString();
    }

    guardarHistorial(lote, campo, lote[campo], valorFinal);

    return actualizado;
  });

  setLotes(nuevosLotes);

  if (campo === 'numero') {
    setLoteSeleccionado(
      nuevosLotes.find((l) => l.numero === valorFinal)
    );
  } else {
    setLoteSeleccionado(
      nuevosLotes.find((l) => l.numero === numeroOriginal)
    );
  }
}

  function moverPunto(numero, index, campo, valor) {
    if (!puedeEditarTodo) return;

    const nuevosLotes = lotes.map((lote) => {
      if (lote.numero !== numero) return lote;

      const nuevosPuntos = lote.puntos.map((p, i) =>
        i === index ? { ...p, [campo]: Number(valor) } : p
      );

      return { ...lote, puntos: nuevosPuntos };
    });

    setLotes(nuevosLotes);
    setLoteSeleccionado(nuevosLotes.find((l) => l.numero === numero));
  }

  function arrastrarPunto(event) {
    if (!puntoArrastrando || !puedeEditarTodo) return;

    const punto = obtenerPosicion(event);

    const nuevosLotes = lotes.map((lote) => {
      if (lote.numero !== puntoArrastrando.numero) return lote;

      const nuevosPuntos = lote.puntos.map((p, i) =>
        i === puntoArrastrando.index ? punto : p
      );

      return { ...lote, puntos: nuevosPuntos };
    });

    setLotes(nuevosLotes);
    setLoteSeleccionado(
      nuevosLotes.find((l) => l.numero === puntoArrastrando.numero)
    );
  }

  function eliminarLote(numero) {
    if (!puedeEditarTodo) return;

    if (confirm(`¿Eliminar lote ${numero}?`)) {
      setLotes(lotes.filter((l) => l.numero !== numero));
      setLoteSeleccionado(null);
    }
  }

  function borrarTodo() {
    if (!puedeEditarTodo) return;

    if (confirm(`¿Borrar todos los lotes de "${proyectoActual.nombre}"?`)) {
      setLotes([]);
      setPuntosNuevoLote([]);
      setContador(1);
      setLoteSeleccionado(null);
      localStorage.removeItem(storageKey);
    }
  }

  function exportarJSON() {
    const datos = {
      proyecto: proyectoActual.nombre,
      imagen: proyectoActual.imagen,
      fechaExportacion: new Date().toISOString(),
      lotes,
    };

    const archivo = new Blob([JSON.stringify(datos, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = `${proyectoActual.id}-lotes.json`;
    enlace.click();

    URL.revokeObjectURL(url);
  }

  function importarJSON(event) {
    if (!puedeEditarTodo) return;

    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function (e) {
      try {
        const datos = JSON.parse(e.target.result);

        if (!datos.lotes || !Array.isArray(datos.lotes)) {
          alert('El archivo JSON no tiene el formato correcto.');
          return;
        }

        setLotes(datos.lotes);

        const siguiente =
          datos.lotes.length > 0
            ? Math.max(...datos.lotes.map((l) => l.numero)) + 1
            : 1;

        setContador(siguiente);
        setLoteSeleccionado(null);
        setPuntosNuevoLote([]);

        alert('Lotes importados correctamente.');
      } catch (error) {
        alert('No se pudo leer el archivo JSON.');
      }
    };

    lector.readAsText(archivo);
    event.target.value = '';
  }

  function puntosTexto(puntos) {
    return puntos.map((p) => `${p.x},${p.y}`).join(' ');
  }

  function centroLote(puntos) {
    const x = puntos.reduce((sum, p) => sum + p.x, 0) / puntos.length;
    const y = puntos.reduce((sum, p) => sum + p.y, 0) / puntos.length;
    return { x, y };
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUsuario(null);
    setPerfil(null);
    setModoEditor(false);
    setLoteSeleccionado(null);
  }

  async function cargarHistorial() {
  const proyecto = await obtenerProyectoSupabase(false);
  if (!proyecto) return;

  const { data, error } = await supabase
    .from('historial_cambios')
    .select('*')
    .eq('proyecto_id', proyecto.id)
    .order('fecha', { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    alert('Error cargando historial.');
    return;
  }

  setHistorial(data || []);
  setMostrarHistorial(true);
}

function generarPDFLote() {
  if (!loteSeleccionado) return;

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('DR Maps', 20, 20);

  doc.setFontSize(14);
  doc.text(`Proyecto: ${proyectoActual.nombre}`, 20, 35);
  doc.text(`Lote: ${loteSeleccionado.numero}`, 20, 50);
  doc.text(`Estado: ${loteSeleccionado.estado.toUpperCase()}`, 20, 60);

  doc.text(`Área: ${loteSeleccionado.area || 'No registrada'}`, 20, 75);
  doc.text(`Precio: ${loteSeleccionado.precio || 'No registrado'}`, 20, 85);
  doc.text(`Asesor: ${loteSeleccionado.asesor || 'No registrado'}`, 20, 95);
  doc.text(`Teléfono: ${loteSeleccionado.telefono || 'No registrado'}`, 20, 105);

  doc.text(
    `Fecha de reserva: ${loteSeleccionado.fecha_reserva || 'No aplica'}`,
    20,
    115
  );

  doc.text('Observaciones:', 20, 130);

  const observaciones = doc.splitTextToSize(
    loteSeleccionado.observaciones || 'Sin observaciones.',
    170
  );

  doc.text(observaciones, 20, 140);

  doc.save(`lote-${loteSeleccionado.numero}-${proyectoActual.id}.pdf`);
}

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial', position: 'relative' }}>
      
      

      {usuario && (
  <Dashboard
    rol={rol}
    totalLotes={totalLotes}
    libres={libres}
    reservados={reservados}
    vendidos={vendidos}
    valorDisponible={valorDisponible}
    areaDisponible={areaDisponible}
  />
)}
          
      
  

          <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 15,
          padding: '10px 20px 0 20px',
        }}
      >
        {usuario ? (
          <button onClick={cerrarSesion}>
            Cerrar sesión ({rol})
          </button>
        ) : (
          <button onClick={() => setMostrarLogin(true)}>
            Iniciar sesión
          </button>
        )}
      </div>

      {mostrarLogin && !usuario && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <button
              onClick={() => setMostrarLogin(false)}
              style={{ float: 'right' }}
            >
              X
            </button>

            <Login
              onLogin={async (user) => {
                setUsuario(user);
                setMostrarLogin(false);

                const { data } = await supabase
                  .from('perfiles')
                  .select('*')
                  .eq('id', user.id)
                  .single();

                setPerfil(data);
              }}
            />
          </div>
        </div>
      )}

      <header className="app-header">
  <div className="app-logo">🏘️</div>

  <div>
    <h1>DR Maps</h1>
    <p>Sistema inteligente para gestión de lotificaciones</p>
  </div>
</header>

      <section className="project-panel">
  <div className="project-selector">
    <label>Proyecto</label>

    <select
      value={proyectoActual.id}
      onChange={(e) => setProyectoActualId(e.target.value)}
    >
      {proyectos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre}
        </option>
      ))}
    </select>
  </div>

  {esAdmin && (
    <div className="admin-actions">
      <button onClick={crearProyecto}>➕ Nuevo proyecto</button>
      <button onClick={eliminarProyecto}>🗑️ Eliminar proyecto</button>
      <button onClick={cargarHistorial}>📜 Ver historial</button>
    </div>
  )}

</section>

      <h2>{proyectoActual.nombre}</h2>

      <div style={{ marginBottom: 10 }}>
        {esAdmin && (
          <>
            <button onClick={() => setModoEditor(!modoEditor)}>
              {modoEditor ? '✅ Desactivar editor' : '✏️ Activar editor'}
            </button>

            <button onClick={finalizarLote} style={{ marginLeft: 8 }}>
              ✅ Finalizar lote
            </button>

            <button onClick={() => setPuntosNuevoLote([])} style={{ marginLeft: 8 }}>
              ↩️ Cancelar puntos
            </button>
          </>
        )}

        {puedeCambiarEstado && (
          <>
            <button onClick={() => guardarEnSupabase(true)} style={{ marginLeft: 8 }}>
              ☁️ Guardar nube
            </button>

            <button onClick={() => cargarDesdeSupabase(true)} style={{ marginLeft: 8 }}>
              📥 Cargar nube
            </button>
          </>
        )}

        {esAdmin && (
          <>
            <button onClick={exportarJSON} style={{ marginLeft: 8 }}>
              📤 Exportar JSON
            </button>

            <button
              onClick={() => importInputRef.current.click()}
              style={{ marginLeft: 8 }}
            >
              📥 Importar JSON
            </button>

            <input
              type="file"
              accept=".json,application/json"
              ref={importInputRef}
              onChange={importarJSON}
              style={{ display: 'none' }}
            />

            <button onClick={borrarTodo} style={{ marginLeft: 8 }}>
              🗑️ Borrar lotes
            </button>
          </>
        )}
      </div>

      <section className="search-panel">
  <p>
    {esAdmin && modoEditor
      ? 'Haz clic en las esquinas del lote. Luego presiona Finalizar lote.'
      : 'Vista pública: consulta disponibilidad de lotes.'}
  </p>

  <div className="status-legend">
    <span><b className="dot libre"></b> Libre</span>
    <span><b className="dot reservado"></b> Reservado</span>
    <span><b className="dot vendido"></b> Vendido</span>
  </div>

  <BuscadorLote
    busquedaLote={busquedaLote}
    setBusquedaLote={setBusquedaLote}
    buscarLote={buscarLote}
  />
</section>


      <MapaLotes
        svgRef={svgRef}
        proyectoActual={proyectoActual}
        lotes={lotes}
        loteSeleccionado={loteSeleccionado}
        setLoteSeleccionado={setLoteSeleccionado}
        puntosNuevoLote={puntosNuevoLote}
        modoEditor={modoEditor}
        esAdmin={esAdmin}
        agregarPunto={agregarPunto}
        arrastrarPunto={arrastrarPunto}
        setPuntoArrastrando={setPuntoArrastrando}
        colorEstado={colorEstado}
        puntosTexto={puntosTexto}
        centroLote={centroLote}
        zoomMapa={zoomMapa}
        setZoomMapa={setZoomMapa}
      />

      {loteSeleccionado && (
  <ModalLote
    loteSeleccionado={loteSeleccionado}
    setLoteSeleccionado={setLoteSeleccionado}
    esAdmin={esAdmin}
    esVendedor={esVendedor}
    usuario={usuario}
    puedeCambiarEstado={puedeCambiarEstado}
    actualizarLote={actualizarLote}
    moverPunto={moverPunto}
    eliminarLote={eliminarLote}
    generarPDFLote={generarPDFLote}
    proyectoActual={proyectoActual}
  />
)}
    
      {mostrarHistorial && (
        <HistorialModal
          historial={historial}
          onCerrar={() => setMostrarHistorial(false)}
        />
      )}

      <p>Total de lotes: {lotes.length}</p>
    </div>
  );
}

export default App;