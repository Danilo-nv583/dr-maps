function ModalLote({
  loteSeleccionado,
  setLoteSeleccionado,
  esAdmin,
  esVendedor,
  usuario,
  puedeCambiarEstado,
  actualizarLote,
  moverPunto,
  eliminarLote,
  generarPDFLote,
}) {


      function agregarAsesor() {
    const asesoresActuales = loteSeleccionado.asesores || [];

    actualizarLote(loteSeleccionado.numero, 'asesores', [
      ...asesoresActuales,
      { nombre: '', telefono: '' },
    ]);
  }

  function actualizarAsesor(index, campo, valor) {
    const nuevosAsesores = (loteSeleccionado.asesores || []).map((asesor, i) =>
      i === index ? { ...asesor, [campo]: valor } : asesor
    );

    actualizarLote(loteSeleccionado.numero, 'asesores', nuevosAsesores);
  }

  function eliminarAsesor(index) {
    const nuevosAsesores = (loteSeleccionado.asesores || []).filter(
      (_, i) => i !== index
    );

    actualizarLote(loteSeleccionado.numero, 'asesores', nuevosAsesores);
  }


  return (
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
                actualizarLote(loteSeleccionado.numero, 'numero', e.target.value)
              }
              style={{ width: '100%', marginBottom: 10 }}
            />
          </>
        )}

        <p>
          Estado actual:{' '}
          <strong>{loteSeleccionado.estado.toUpperCase()}</strong>
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

        {loteSeleccionado.asesor && (
          <p>
            Asesor: <strong>{loteSeleccionado.asesor}</strong>
          </p>
        )}

        {loteSeleccionado.telefono && (
          <p>
            Teléfono: <strong>{loteSeleccionado.telefono}</strong>
          </p>
        )}

        {loteSeleccionado.telefono && (
          <a href={`tel:${loteSeleccionado.telefono}`}>
            <button style={{ marginBottom: 15 }}>
              📞 Llamar asesor
            </button>
          </a>
        )}

                    {(loteSeleccionado.asesores || []).length > 0 && (
            <div style={{ marginBottom: 15 }}>
                <h3>Asesores</h3>

                {(loteSeleccionado.asesores || []).map((asesor, index) => (
                <div
                    key={index}
                    style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                    }}
                >
                    <p>
                    <strong>{asesor.nombre || 'Asesor sin nombre'}</strong>
                    </p>

                    {asesor.telefono && (
                    <a href={`tel:${asesor.telefono}`}>
                        <button>📞 Llamar</button>
                    </a>
                    )}
                </div>
                ))}
            </div>
            )}

        {(esAdmin || esVendedor) && loteSeleccionado.observaciones && (
          <p>
            Observaciones:{' '}
            <strong>{loteSeleccionado.observaciones}</strong>
          </p>
        )}

        {loteSeleccionado.fecha_reserva && (
          <p>
            📅 Reservado desde:{' '}
            <strong>{loteSeleccionado.fecha_reserva}</strong>
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
                actualizarLote(loteSeleccionado.numero, 'area', e.target.value)
              }
              style={{ width: '100%', marginBottom: 10 }}
            />

            <label>Precio</label>
            <input
              type="text"
              placeholder="Ejemplo: Q150,000"
              value={loteSeleccionado.precio || ''}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'precio', e.target.value)
              }
              style={{ width: '100%', marginBottom: 15 }}
            />

            <label>Asesor</label>
            <input
              type="text"
              placeholder="Ejemplo: Carlos López"
              value={loteSeleccionado.asesor || ''}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'asesor', e.target.value)
              }
              style={{ width: '100%', marginBottom: 10 }}
            />

            <label>Teléfono</label>
            <input
              type="text"
              placeholder="Ejemplo: 5555-5555"
              value={loteSeleccionado.telefono || ''}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'telefono', e.target.value)
              }
              style={{ width: '100%', marginBottom: 15 }}

              
            />

            <h3>Asesores adicionales</h3>

{(loteSeleccionado.asesores || []).map((asesor, index) => (
  <div
    key={index}
    style={{
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
    }}
  >
    <label>Nombre del asesor</label>
    <input
      type="text"
      value={asesor.nombre || ''}
      onChange={(e) =>
        actualizarAsesor(index, 'nombre', e.target.value)
      }
      style={{ width: '100%', marginBottom: 8 }}
    />

    <label>Teléfono del asesor</label>
    <input
      type="text"
      value={asesor.telefono || ''}
      onChange={(e) =>
        actualizarAsesor(index, 'telefono', e.target.value)
      }
      style={{ width: '100%', marginBottom: 8 }}
    />

    <button onClick={() => eliminarAsesor(index)}>
      🗑️ Quitar asesor
    </button>
  </div>
))}

<button
  onClick={agregarAsesor}
  style={{ marginBottom: 15 }}
>
  ➕ Agregar asesor
</button>

            <label>Observaciones</label>
            <textarea
              placeholder="Ejemplo: Cliente interesado, pendiente de papelería..."
              value={loteSeleccionado.observaciones || ''}
              onChange={(e) =>
                actualizarLote(
                  loteSeleccionado.numero,
                  'observaciones',
                  e.target.value
                )
              }
              style={{
                width: '100%',
                marginBottom: 15,
                minHeight: 80,
              }}
            />
          </>
        )}

        {puedeCambiarEstado && (
          <>
            <label>Estado</label>
            <select
              value={loteSeleccionado.estado}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'estado', e.target.value)
              }
              style={{ width: '100%', marginBottom: 15 }}
            >
              <option value="libre">Libre</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </>
        )}

        {!usuario && <p>Para más información comunícate con el asesor.</p>}

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
                    moverPunto(loteSeleccionado.numero, i, 'x', e.target.value)
                  }
                />

                <input
                  type="number"
                  step="0.1"
                  value={p.y}
                  onChange={(e) =>
                    moverPunto(loteSeleccionado.numero, i, 'y', e.target.value)
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

        {usuario && (
          <button
            onClick={generarPDFLote}
            style={{ marginRight: 10, marginBottom: 10 }}
          >
            📄 Descargar ficha PDF
          </button>
        )}

        <button onClick={() => setLoteSeleccionado(null)}>Cerrar</button>
      </div>
    </div>
  );
}

export default ModalLote;