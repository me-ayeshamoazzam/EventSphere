import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Minus, Plus, RotateCcw, Search } from 'lucide-react';

const getBoothStyle = (status, isSelected) => {
  const s = (status || 'Available').toLowerCase();
  if (isSelected) {
    return {
      fill: '#fff7ed',
      stroke: '#f97316',
      strokeWidth: 2.5,
      titleColor: '#9a3412',
      subColor: '#ea580c',
      accentBar: '#f97316',
    };
  }
  if (s === 'booked' || s === 'reserved') {
    return {
      fill: '#18181b',
      stroke: '#09090b',
      strokeWidth: 1.5,
      titleColor: '#ffffff',
      subColor: '#a1a1aa',
      accentBar: '#f97316',
    };
  }
  if (s === 'pending') {
    return {
      fill: '#e4e4e7',
      stroke: '#71717a',
      strokeWidth: 1.5,
      titleColor: '#18181b',
      subColor: '#52525b',
      accentBar: '#71717a',
    };
  }
  return {
    fill: '#ffffff',
    stroke: '#27272a',
    strokeWidth: 1.5,
    titleColor: '#09090b',
    subColor: '#52525b',
    accentBar: '#27272a',
  };
};

function FloorPlanMap({
  booths = [],
  selectedBooth,
  onSelectBooth,
  socketConnected = false,
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [hoveredBooth, setHoveredBooth] = useState(null);

  const zones = useMemo(() => {
    const unique = new Set(['All']);
    booths.forEach((b) => {
      if (b.zone) unique.add(b.zone);
    });
    return Array.from(unique);
  }, [booths]);

  const filteredBooths = useMemo(() => {
    return booths.filter((b) => {
      if (zoneFilter !== 'All' && (b.zone || 'Main Hall') !== zoneFilter) {
        return false;
      }
      const normStatus = (b.status || 'Available').toLowerCase();
      if (statusFilter === 'Available' && normStatus !== 'available') return false;
      if (statusFilter === 'Booked' && normStatus !== 'booked' && normStatus !== 'reserved') return false;
      if (statusFilter === 'Pending' && normStatus !== 'pending') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const num = (b.boothNumber || '').toLowerCase();
        const company = (b.exhibitor?.companyName || b.exhibitorId?.companyName || '').toLowerCase();
        if (!num.includes(q) && !company.includes(q)) return false;
      }
      return true;
    });
  }, [booths, zoneFilter, statusFilter, searchQuery]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 760;
    const height = 440;

    const stage = new Konva.Stage({
      container,
      width,
      height,
      draggable: true,
    });
    stageRef.current = stage;

    stage.scale({ x: zoom, y: zoom });

    const bgLayer = new Konva.Layer();
    const boothLayer = new Konva.Layer();
    stage.add(bgLayer);
    stage.add(boothLayer);

    // Architectural gridlines
    const gridSize = 25;
    for (let x = 0; x <= 900; x += gridSize) {
      bgLayer.add(
        new Konva.Line({
          points: [x, 0, x, 500],
          stroke: '#e4e4e7',
          strokeWidth: x % 100 === 0 ? 1 : 0.5,
        })
      );
    }
    for (let y = 0; y <= 500; y += gridSize) {
      bgLayer.add(
        new Konva.Line({
          points: [0, y, 900, y],
          stroke: '#e4e4e7',
          strokeWidth: y % 100 === 0 ? 1 : 0.5,
        })
      );
    }

    // Venue architectural landmarks (Stage, Concourse, Entrance)
    bgLayer.add(
      new Konva.Rect({
        x: 40,
        y: 16,
        width: 505,
        height: 30,
        fill: '#0a0a0b',
        cornerRadius: 4,
      })
    );
    bgLayer.add(
      new Konva.Text({
        x: 40,
        y: 25,
        width: 505,
        align: 'center',
        text: 'KEYNOTE STAGE & MAIN PLENARY',
        fontSize: 10.5,
        fontStyle: 'bold',
        fontFamily: 'JetBrains Mono, monospace',
        fill: '#f97316',
        letterSpacing: 1.2,
      })
    );
    bgLayer.add(
      new Konva.Text({
        x: 40,
        y: 168,
        text: 'MAIN CONCOURSE AISLE  →',
        fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        fill: '#71717a',
      })
    );
    bgLayer.add(
      new Konva.Text({
        x: 40,
        y: 296,
        text: 'STARTUP & INNOVATION WALKWAY  →',
        fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        fill: '#71717a',
      })
    );
    bgLayer.add(
      new Konva.Rect({
        x: 580,
        y: 16,
        width: 150,
        height: 30,
        fill: '#ffffff',
        stroke: '#27272a',
        strokeWidth: 1,
        cornerRadius: 4,
      })
    );
    bgLayer.add(
      new Konva.Text({
        x: 580,
        y: 25,
        width: 150,
        align: 'center',
        text: 'NORTH ENTRANCE',
        fontSize: 10,
        fontStyle: 'bold',
        fontFamily: 'JetBrains Mono, monospace',
        fill: '#09090b',
      })
    );

    // Draw filtered booths
    filteredBooths.forEach((booth) => {
      const coords = booth.coordinates || { x: 40, y: 70, width: 110, height: 75 };
      const w = coords.width || 110;
      const h = coords.height || 75;
      const isSelected = selectedBooth?._id === booth._id;
      const style = getBoothStyle(booth.status, isSelected);

      const group = new Konva.Group({
        x: coords.x,
        y: coords.y,
      });

      const rect = new Konva.Rect({
        width: w,
        height: h,
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        cornerRadius: 4,
      });

      const topStrip = new Konva.Rect({
        x: 0,
        y: 0,
        width: w,
        height: 4,
        fill: style.accentBar,
        cornerRadius: [4, 4, 0, 0],
      });

      const title = new Konva.Text({
        x: 8,
        y: 12,
        width: w - 16,
        text: booth.boothNumber || 'BOOTH',
        fontSize: 13,
        fontStyle: 'bold',
        fontFamily: 'JetBrains Mono, monospace',
        fill: style.titleColor,
      });

      const exhibitorName =
        booth.exhibitor?.companyName || booth.exhibitorId?.companyName || '';
      const subLabel = exhibitorName
        ? exhibitorName
        : `${booth.status || 'Available'}${booth.price ? ` · $${booth.price}` : ''}`;

      const subText = new Konva.Text({
        x: 8,
        y: 32,
        width: w - 16,
        height: h - 38,
        text: subLabel,
        fontSize: 11,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fill: style.subColor,
        ellipsis: true,
      });

      group.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
        setHoveredBooth(booth);
      });
      group.on('mouseleave', () => {
        stage.container().style.cursor = 'grab';
        setHoveredBooth(null);
      });
      group.on('click tap', () => {
        onSelectBooth?.(booth);
      });

      group.add(rect);
      group.add(topStrip);
      group.add(title);
      group.add(subText);
      boothLayer.add(group);
    });

    bgLayer.draw();
    boothLayer.draw();

    return () => {
      stage.destroy();
    };
  }, [filteredBooths, selectedBooth, zoom, onSelectBooth]);

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    if (stageRef.current) {
      stageRef.current.position({ x: 0, y: 0 });
      stageRef.current.scale({ x: 1, y: 1 });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="map-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="segmented-bar" role="tablist" aria-label="Floor plan zones">
            {zones.map((z) => (
              <button
                key={z}
                type="button"
                className={`segmented-btn ${zoneFilter === z ? 'active-orange' : ''}`}
                onClick={() => setZoneFilter(z)}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="segmented-bar" role="tablist" aria-label="Booth availability filter">
            {['All', 'Available', 'Pending', 'Booked'].map((st) => (
              <button
                key={st}
                type="button"
                className={`segmented-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="search-input-wrap">
            <Search size={14} className="search-input-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find booth or company..."
              aria-label="Search booth number or company"
            />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleZoomOut}
              aria-label="Zoom out floor plan"
            >
              <Minus size={14} />
            </button>
            <span className="mono" style={{ fontSize: 12, padding: '0 6px', color: '#52525b' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleZoomIn}
              aria-label="Zoom in floor plan"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleResetView}
              aria-label="Reset map position"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="konva-viewport">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {hoveredBooth && (
          <div className="map-hud-tooltip">
            <div className="map-hud-title">
              <span>Booth {hoveredBooth.boothNumber}</span>
              <span className="map-hud-orange">
                {hoveredBooth.price ? `$${hoveredBooth.price}` : hoveredBooth.status}
              </span>
            </div>
            <div className="map-hud-row">
              {hoveredBooth.zone || 'Main Hall'} · {hoveredBooth.size || 'Standard'}
            </div>
            <div className="map-hud-row">
              Status: <strong>{hoveredBooth.status || 'Available'}</strong>
            </div>
            {(hoveredBooth.exhibitor?.companyName || hoveredBooth.exhibitorId?.companyName) && (
              <div className="map-hud-row">
                Exhibitor:{' '}
                <strong>
                  {hoveredBooth.exhibitor?.companyName || hoveredBooth.exhibitorId?.companyName}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="map-legend">
          <span className="legend-swatch-item">
            <span className="swatch swatch-available" /> Available
          </span>
          <span className="legend-swatch-item">
            <span className="swatch swatch-pending" /> Pending
          </span>
          <span className="legend-swatch-item">
            <span className="swatch swatch-booked" /> Booked
          </span>
          <span className="legend-swatch-item">
            <span className="swatch swatch-selected" /> Selected
          </span>
        </div>

        <div className="live-indicator">
          <span className={socketConnected ? 'live-dot-active' : 'live-dot-idle'} />
          <span>{socketConnected ? 'Live Socket Connected' : 'Connecting Socket'}</span>
          <span aria-hidden="true">·</span>
          <span className="mono">{filteredBooths.length} booths shown</span>
        </div>
      </div>
    </div>
  );
}

export default FloorPlanMap;
