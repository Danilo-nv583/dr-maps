function MapaLotes({
  svgRef,
  proyectoActual,
  lotes,
  loteSeleccionado,
  setLoteSeleccionado,
  puntosNuevoLote,
  modoEditor,
  esAdmin,
  agregarPunto,
  arrastrarPunto,
  setPuntoArrastrando,
  colorEstado,
  puntosTexto,
  centroLote,
  zoomMapa,
  setZoomMapa,
}) {
  return (
    <div style={{ width: '95%', maxWidth: '1000px', margin: 'auto' }}>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setZoomMapa(Math.max(1, zoomMapa - 0.25))}>
          ➖
        </button>

        <strong style={{ margin: '0 10px' }}>
          Zoom: {Math.round(zoomMapa * 100)}%
        </strong>

        <button onClick={() => setZoomMapa(Math.min(3, zoomMapa + 0.25))}>
          ➕
        </button>

        <button onClick={() => setZoomMapa(1)} style={{ marginLeft: 8 }}>
          Reiniciar
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxHeight: '75vh',
          overflow: 'auto',
          border: '2px solid #ccc',
          borderRadius: 10,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: `${zoomMapa * 100}%`,
            minWidth: '100%',
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
                    stroke={
                      loteSeleccionado?.numero === lote.numero
                        ? '#0000ff'
                        : '#222'
                    }
                    strokeWidth={
                      loteSeleccionado?.numero === lote.numero ? '0.8' : '0.2'
                    }
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
      </div>
    </div>
  );
}

export default MapaLotes;