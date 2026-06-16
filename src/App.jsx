import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase/supabase';
import Login from './components/Login';

const proyectosIniciales = [
  {
    id: 'el-tejar',
    nombre: 'Lotificación El Tejar',
    imagen: 'mapa-el-tejar.jpeg',
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

  const [proyectos, setProyectos] = useState(() => {
    const guardados = localStorage.getItem('drmaps-proyectos');
    return guardados ? JSON.parse(guardados) : proyectosIniciales;
  });

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
    };

    setLotes([...lotes, nuevo]);
    setContador(contador + 1);
    setPuntosNuevoLote([]);
    setLoteSeleccionado(nuevo);
  }

  function actualizarLote(numeroOriginal, campo, valor) {
    if (campo !== 'estado' && !puedeEditarTodo) return;
    if (campo === 'estado' && !puedeCambiarEstado) return;

    const valorFinal =
      campo === 'estado' || campo === 'area' || campo === 'precio'
        ? valor
        : Number(valor);

    const nuevosLotes = lotes.map((lote) =>
      lote.numero === numeroOriginal ? { ...lote, [campo]: valorFinal } : lote
    );

    setLotes(nuevosLotes);

    if (campo === 'numero') {
      setLoteSeleccionado(nuevosLotes.find((l) => l.numero === valorFinal));
    } else {
      setLoteSeleccionado(nuevosLotes.find((l) => l.numero === numeroOriginal));
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

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial', position: 'relative' }}>
      
      
      <div
      
  style={{
    background: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: 20,
  }}
>
  <h2>📊 Resumen del Proyecto</h2>

  <p>🏘️ Total de lotes: {totalLotes}</p>

  <p>🟢 Libres: {libres}</p>

  <p>🟡 Reservados: {reservados}</p>

  <p>🔴 Vendidos: {vendidos}</p>

  <p>
    💰 Valor disponible: Q
    {valorDisponible.toLocaleString()}
  </p>

  <p>
    📐 Área disponible:
    {' '}
    {areaDisponible.toLocaleString()} m²
  </p>
</div>

      <div style={{ position: 'absolute', top: 15, right: 20 }}>
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

      <h1>🏘️ DR Maps</h1>

      <div style={{ marginBottom: 12 }}>
        <label>Proyecto: </label>

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

        {esAdmin && (
          <>
            <button onClick={crearProyecto} style={{ marginLeft: 8 }}>
              ➕ Nuevo proyecto
            </button>

            <button onClick={eliminarProyecto} style={{ marginLeft: 8 }}>
              🗑️ Eliminar proyecto
            </button>
          </>
        )}
      </div>

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

      <p>
        {esAdmin && modoEditor
          ? 'Haz clic en las esquinas del lote. Luego presiona Finalizar lote.'
          : 'Vista pública: consulta disponibilidad de lotes.'}
      </p>

      <div style={{ marginBottom: 15 }}>
        🟢 Libre &nbsp;&nbsp; 🟡 Reservado &nbsp;&nbsp; 🔴 Vendido
      </div>


        <div style={{ marginBottom: 15 }}>
  <input
    type="number"
    placeholder="Buscar lote..."
    value={busquedaLote}
    onChange={(e) => setBusquedaLote(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') buscarLote();
    }}
    style={{
      padding: 10,
      width: 180,
      borderRadius: 8,
      border: '1px solid #ccc',
    }}
  />

  <button
    onClick={buscarLote}
    style={{
      marginLeft: 8,
      padding: 10,
      borderRadius: 8,
      cursor: 'pointer',
    }}
  >
    🔍 Buscar
  </button>
</div>


      <div
        style={{
          position: 'relative',
          width: '95%',
          maxWidth: '1000px',
          margin: 'auto',
          border: '2px solid #ccc',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <img
          src={`/${proyectoActual.imagen}`}
          alt={proyectoActual.nombre}
          style={{ width: '100%', display: 'block' }}
        />

        <svg
          ref={svgRef}
          onClick={agregarPunto}
          onMouseMove={arrastrarPunto}
          onMouseUp={() => setPuntoArrastrando(null)}
          onMouseLeave={() => setPuntoArrastrando(null)}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: esAdmin && modoEditor ? 'crosshair' : 'default',
          }}
        >
          {lotes.map((lote) => {
            const centro = centroLote(lote.puntos);

            return (
              <g key={lote.numero}>
                <polygon
                  points={puntosTexto(lote.puntos)}
                  fill={colorEstado(lote.estado)}
                  stroke={loteSeleccionado?.numero === lote.numero ? '#0000ff' : '#222'}
                  strokeWidth={loteSeleccionado?.numero === lote.numero ? '0.8' : '0.2'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLoteSeleccionado(lote);
                  }}
                  style={{ cursor: 'pointer' }}
                />

                <text
                  x={centro.x}
                  y={centro.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {lote.numero}
                </text>

                {esAdmin &&
                  modoEditor &&
                  loteSeleccionado?.numero === lote.numero &&
                  lote.puntos.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="0.9"
                      fill="#007bff"
                      stroke="white"
                      strokeWidth="0.25"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setPuntoArrastrando({
                          numero: lote.numero,
                          index: i,
                        });
                      }}
                      style={{ cursor: 'grab' }}
                    />
                  ))}
              </g>
            );
          })}

          {esAdmin && puntosNuevoLote.length > 0 && (
            <>
              <polyline
                points={puntosTexto(puntosNuevoLote)}
                fill="none"
                stroke="#007bff"
                strokeWidth="0.3"
              />

              {puntosNuevoLote.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="0.7" fill="#007bff" />
              ))}
            </>
          )}
        </svg>
      </div>

      {loteSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
                background: 'white',
                padding: 25,
                borderRadius: 12,

                width: '90%',
                maxWidth: '500px',

                maxHeight: '90vh',
                overflowY: 'auto',

                textAlign: 'left',

                resize: 'both',
                overflow: 'auto',
                  }}
          >
            <h2>Lote {loteSeleccionado.numero}</h2>

            {esAdmin && (
              <>
                <label>Número</label>
                <input
                  type="number"
                  value={loteSeleccionado.numero}
                  onChange={(e) =>
                    actualizarLote(
                      loteSeleccionado.numero,
                      'numero',
                      e.target.value
                    )
                  }
                  style={{ width: '100%', marginBottom: 10 }}
                />
              </>
            )}

            <p>
              Estado actual: <strong>{loteSeleccionado.estado.toUpperCase()}</strong>
            </p>

           {loteSeleccionado.area && (

            <p>
               Área: <strong>{loteSeleccionado.area}</strong>
           </p>
)}

          {loteSeleccionado.precio && (
            <p>
              Precio: <strong>{loteSeleccionado.precio}</strong>
          </p>
)}

            {esAdmin && (
              <>
                <label>Área / medida del lote</label>
                <input
                  type="text"
                  placeholder="Ejemplo: 250 m² o 10 x 25 m"
                  value={loteSeleccionado.area || ''}
                  onChange={(e) =>
                    actualizarLote(
                      loteSeleccionado.numero,
                      'area',
                      e.target.value
                    )
                  }
                  style={{ width: '100%', marginBottom: 10 }}
                />

                <label>Precio</label>
                <input
                  type="text"
                  placeholder="Ejemplo: Q150,000"
                  value={loteSeleccionado.precio || ''}
                  onChange={(e) =>
                    actualizarLote(
                      loteSeleccionado.numero,
                      'precio',
                      e.target.value
                    )
                  }
                  style={{ width: '100%', marginBottom: 15 }}
                />
              </>
            )}

            {puedeCambiarEstado && (
              <>
                <label>Estado</label>
                <select
                  value={loteSeleccionado.estado}
                  onChange={(e) =>
                    actualizarLote(
                      loteSeleccionado.numero,
                      'estado',
                      e.target.value
                    )
                  }
                  style={{ width: '100%', marginBottom: 15 }}
                >
                  <option value="libre">Libre</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                </select>
              </>
            )}

            {!usuario && (
              <p>Para más información comunícate con el asesor.</p>
            )}

            {esAdmin && (
              <>
                <h3>Modificar esquinas</h3>
                <p style={{ fontSize: 13 }}>
                  Puedes cambiar los valores aquí o arrastrar los puntos azules en el mapa.
                </p>

                {loteSeleccionado.puntos.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 1fr 1fr',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span>Esquina {i + 1}</span>

                    <input
                      type="number"
                      step="0.1"
                      value={p.x}
                      onChange={(e) =>
                        moverPunto(
                          loteSeleccionado.numero,
                          i,
                          'x',
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      step="0.1"
                      value={p.y}
                      onChange={(e) =>
                        moverPunto(
                          loteSeleccionado.numero,
                          i,
                          'y',
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}

                <br />

                <button
                  onClick={() => eliminarLote(loteSeleccionado.numero)}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    marginRight: 10,
                  }}
                >
                  🗑️ Eliminar lote
                </button>
              </>
            )}

            <button onClick={() => setLoteSeleccionado(null)}>Cerrar</button>
          </div>
        </div>
      )}

      <p>Total de lotes: {lotes.length}</p>
    </div>
  );
}

export default App;