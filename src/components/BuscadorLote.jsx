function BuscadorLote({
  busquedaLote,
  setBusquedaLote,
  buscarLote,
}) {
  return (
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
  );
}

export default BuscadorLote;