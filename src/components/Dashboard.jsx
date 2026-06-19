function Dashboard({
  rol,
  totalLotes,
  libres,
  reservados,
  vendidos,
  valorDisponible,
  areaDisponible,
}) {
  const puedeVerFinanzas = rol === 'admin' || rol === 'desarrollador';

  const tarjetas = [
    { emoji: '🏘️', titulo: 'Total', valor: totalLotes },
    { emoji: '🟢', titulo: 'Libres', valor: libres },
    { emoji: '🟡', titulo: 'Reservados', valor: reservados },
    { emoji: '🔴', titulo: 'Vendidos', valor: vendidos },
  ];

  if (puedeVerFinanzas) {
    tarjetas.push(
      {
        emoji: '💰',
        titulo: 'Valor disponible',
        valor: `Q${valorDisponible.toLocaleString()}`,
      },
      {
        emoji: '📐',
        titulo: 'Área disponible',
        valor: `${areaDisponible.toLocaleString()} m²`,
      }
    );
  }

  return (
    <div style={{ margin: '20px auto', maxWidth: '1100px' }}>
      <h2 style={{ marginBottom: 20 }}>📊 Dashboard del Proyecto</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 15,
        }}
      >
        {tarjetas.map((item) => (
          <div
            key={item.titulo}
            style={{
              background: 'white',
              borderRadius: 15,
              padding: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: 30 }}>{item.emoji}</div>
            <h1 style={{ margin: '10px 0' }}>{item.valor}</h1>
            <p style={{ color: '#666' }}>{item.titulo}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;