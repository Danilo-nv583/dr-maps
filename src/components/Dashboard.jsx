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
    <div className="dashboard">
      <h2>📊 Dashboard del Proyecto</h2>

      <div className="dashboard-grid">
        {tarjetas.map((item) => (
          <div className="dashboard-card" key={item.titulo}>
            <div className="dashboard-icon">{item.emoji}</div>
            <h1>{item.valor}</h1>
            <p>{item.titulo}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;