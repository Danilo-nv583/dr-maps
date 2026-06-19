function HistorialModal({ historial, onCerrar }) {
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
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 25,
          borderRadius: 12,
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          textAlign: 'left',
        }}
      >
        <h2>📜 Historial de cambios</h2>

        {historial.length === 0 ? (
          <p>No hay cambios registrados.</p>
        ) : (
          historial.map((item) => (
            <div
              key={item.id}
              style={{
                borderBottom: '1px solid #ddd',
                padding: '10px 0',
              }}
            >
              <strong>Lote {item.lote_numero}</strong>
              <p>Usuario: {item.usuario} ({item.rol})</p>
              <p>Campo: {item.campo}</p>
              <p>
                Antes: <strong>{item.valor_anterior || 'vacío'}</strong>
              </p>
              <p>
                Después: <strong>{item.valor_nuevo || 'vacío'}</strong>
              </p>
              <small>{new Date(item.fecha).toLocaleString()}</small>
            </div>
          ))
        )}

        <br />

        <button onClick={onCerrar}>Cerrar</button>
      </div>
    </div>
  );
}

export default HistorialModal;