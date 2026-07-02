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
  proyectoActual,
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

  const estadoTexto = loteSeleccionado.estado.toUpperCase();

  const telefonoPrincipalLimpio = (loteSeleccionado.telefono || '').replace(
    /\D/g,
    ''
  );


  function compartirWhatsApp() {
  const asesores = [
    loteSeleccionado.asesor && loteSeleccionado.telefono
      ? `👤 ${loteSeleccionado.asesor} - 📞 ${loteSeleccionado.telefono}`
      : '',
    ...(loteSeleccionado.asesores || []).map(
      (asesor) =>
        `👤 ${asesor.nombre || 'Asesor'} - 📞 ${asesor.telefono || 'Sin teléfono'}`
    ),
  ]
    .filter(Boolean)
    .join('\n');

  const mensaje = `
🏘️ ${proyectoActual.nombre}

📍 Lote: ${loteSeleccionado.numero}
Estado: ${loteSeleccionado.estado.toUpperCase()}
📐 Área: ${loteSeleccionado.area || 'No registrada'}
💰 Precio: ${loteSeleccionado.precio || 'No registrado'}
📅 Reserva: ${loteSeleccionado.fecha_reserva || 'No aplica'}

${asesores ? `Asesores:\n${asesores}` : ''}

${loteSeleccionado.observaciones ? `📝 Observaciones: ${loteSeleccionado.observaciones}` : ''}

Consulta disponibilidad en DR Maps.
`.trim();

const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
window.open(url, '_blank');
}

  return (
    <div className="modal-overlay">
      <div className="modal-lote">
        <div className="modal-header">
          <div>
            <span className="modal-badge">🏘️ Lote</span>
            <h2>{loteSeleccionado.numero}</h2>
          </div>

          <button
            className="btn-close"
            onClick={() => setLoteSeleccionado(null)}
          >
            ✕
          </button>
        </div>

        <div className={`estado-pill ${loteSeleccionado.estado}`}>
          {estadoTexto}
        </div>

        <div className="info-grid">
          {loteSeleccionado.area && (
            <div className="info-card">
              <span>📐 Área</span>
              <strong>{loteSeleccionado.area}</strong>
            </div>
          )}

          {loteSeleccionado.precio && (
            <div className="info-card">
              <span>💰 Precio</span>
              <strong>{loteSeleccionado.precio}</strong>
            </div>
          )}

          {loteSeleccionado.fecha_reserva && (
            <div className="info-card">
              <span>📅 Reserva</span>
              <strong>{loteSeleccionado.fecha_reserva}</strong>
            </div>
          )}
        </div>

        {(loteSeleccionado.asesor || loteSeleccionado.telefono) && (
          <div className="section-card">
            <h3>👤 Asesor principal</h3>

            {loteSeleccionado.asesor && <p>{loteSeleccionado.asesor}</p>}

            {loteSeleccionado.telefono && (
              <div className="asesor-botones">
                <a href={`tel:${loteSeleccionado.telefono}`}>
                  <button className="btn-call">📞 Llamar asesor</button>
                </a>

                {telefonoPrincipalLimpio && (
                  <a
                    href={`https://wa.me/502${telefonoPrincipalLimpio}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btn-whatsapp">💬 WhatsApp</button>
                  </a>

                  
                )}
              </div>
            )}
          </div>
        )}

        

        {(loteSeleccionado.asesores || []).length > 0 && (
          <div className="section-card">
            <h3>👥 Asesores adicionales</h3>

            {(loteSeleccionado.asesores || []).map((asesor, index) => {
              const telefonoAsesorLimpio = (asesor.telefono || '').replace(
                /\D/g,
                ''
              );

              return (
                <div className="asesor-card" key={index}>
                  <strong>{asesor.nombre || 'Asesor sin nombre'}</strong>

                  {asesor.telefono && (
                    <div className="asesor-botones">
                      <a href={`tel:${asesor.telefono}`}>
                        <button className="btn-call">📞 Llamar</button>
                      </a>

                      {telefonoAsesorLimpio && (
                        <a
                          href={`https://wa.me/502${telefonoAsesorLimpio}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <button className="btn-whatsapp">💬 WhatsApp</button>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(esAdmin || esVendedor) && loteSeleccionado.observaciones && (
          <div className="section-card">
            <h3>📝 Observaciones</h3>
            <p>{loteSeleccionado.observaciones}</p>
          </div>
        )}

        {esAdmin && (
          <div className="admin-edit-card">
            <h3>✏️ Edición administrativa</h3>

            <label>Número</label>
            <input
              type="number"
              value={loteSeleccionado.numero}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'numero', e.target.value)
              }
            />

            <label>Área / medida</label>
            <input
              type="text"
              value={loteSeleccionado.area || ''}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'area', e.target.value)
              }
            />

            <label>Precio</label>
            <input
              type="text"
              value={loteSeleccionado.precio || ''}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'precio', e.target.value)
              }
            />

            <label>Asesor principal</label>
            <input
              type="text"
              value={loteSeleccionado.asesor || ''}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'asesor', e.target.value)
              }
            />

            <label>Teléfono principal</label>
            <input
              type="text"
              value={loteSeleccionado.telefono || ''}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'telefono', e.target.value)
              }
            />

            <h3>👥 Asesores adicionales</h3>

            {(loteSeleccionado.asesores || []).map((asesor, index) => (
              <div className="asesor-edit-card" key={index}>
                <label>Nombre</label>
                <input
                  type="text"
                  value={asesor.nombre || ''}
                  onChange={(e) =>
                    actualizarAsesor(index, 'nombre', e.target.value)
                  }
                />

                <label>Teléfono</label>
                <input
                  type="text"
                  value={asesor.telefono || ''}
                  onChange={(e) =>
                    actualizarAsesor(index, 'telefono', e.target.value)
                  }
                />

                <button onClick={() => eliminarAsesor(index)}>
                  🗑️ Quitar asesor
                </button>
              </div>
            ))}

            <button onClick={agregarAsesor}>➕ Agregar asesor</button>

            <label>Observaciones</label>
            <textarea
              value={loteSeleccionado.observaciones || ''}
              onChange={(e) =>
                actualizarLote(
                  loteSeleccionado.numero,
                  'observaciones',
                  e.target.value
                )
              }
            />
          </div>
        )}

        {puedeCambiarEstado && (
          <div className="section-card">
            <label>Estado</label>
            <select
              value={loteSeleccionado.estado}
              onChange={(e) =>
                actualizarLote(loteSeleccionado.numero, 'estado', e.target.value)
              }
            >
              <option value="libre">Libre</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </div>
        )}

        {esAdmin && (
          <div className="admin-edit-card">
            <h3>📍 Modificar esquinas</h3>

            {loteSeleccionado.puntos.map((p, i) => (
              <div className="corner-grid" key={i}>
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

            <button
              onClick={() => eliminarLote(loteSeleccionado.numero)}
              className="btn-danger"
            >
              🗑️ Eliminar lote
            </button>
          </div>
        )}

        {!usuario && (
          <p className="public-message">
            Para más información comunícate con el asesor.
          </p>
        )}

        <div className="modal-actions">
          {usuario && (
            <button onClick={generarPDFLote}>📄 Descargar PDF</button>
          )}

          {puedeCambiarEstado && (
            <button onClick={compartirWhatsApp}>
              📲 Compartir WhatsApp
            </button>
          )}

          <button onClick={() => setLoteSeleccionado(null)}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default ModalLote;