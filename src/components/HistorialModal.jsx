function HistorialModal({
  historial,
  onCerrar,
  onExportarPDF,
  onBorrarHistorial,
  esAdmin,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 15,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 25,
          borderRadius: 16,
          width: '90%',
          maxWidth: '750px',
          maxHeight: '90vh',
          overflowY: 'auto',
          textAlign: 'left',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        <h2>📜 Historial de cambios</h2>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <button onClick={onExportarPDF}>
            📄 Exportar historial PDF
          </button>

          {esAdmin && (
            <button
              onClick={onBorrarHistorial}
              style={{
                background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
              }}
            >
              🗑️ Borrar historial
            </button>
          )}

          <button onClick={onCerrar}>
            Cerrar
          </button>
        </div>

        {historial.length === 0 ? (
          <p>No hay cambios registrados.</p>
        ) : (
          historial.map((item) => (
            <div
              key={item.id}
              style={{
                borderBottom: '1px solid #ddd',
                padding: '12px 0',
              }}
            >
              <strong>Lote {item.lote_numero}</strong>

              <p>
                Usuario: <strong>{item.usuario}</strong> ({item.rol})
              </p>

              <p>
                Campo modificado: <strong>{item.campo}</strong>
              </p>

              <p>
                Antes: <strong>{item.valor_anterior || 'vacío'}</strong>
              </p>

              <p>
                Después: <strong>{item.valor_nuevo || 'vacío'}</strong>
              </p>

              <small>
                {new Date(item.fecha).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HistorialModal;