import { useState } from 'react';

export function OccupancyBarLineChart({ booths = [], events = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const zonesMap = new Map();
  booths.forEach((b) => {
    const zone = b.zone || 'General Hall';
    if (!zonesMap.has(zone)) {
      zonesMap.set(zone, { label: zone, booked: 0, pending: 0, available: 0, revenue: 0 });
    }
    const entry = zonesMap.get(zone);
    const status = (b.status || 'Available').toLowerCase();
    const price = Number(b.price) || 2500;
    if (status === 'booked' || status === 'reserved') {
      entry.booked += 1;
      entry.revenue += price;
    } else if (status === 'pending') {
      entry.pending += 1;
    } else {
      entry.available += 1;
    }
  });

  const data =
    zonesMap.size > 0
      ? Array.from(zonesMap.values())
      : events.slice(0, 4).map((ev, idx) => ({
          label: ev.title?.slice(0, 14) || `Event ${idx + 1}`,
          booked: 0,
          pending: 0,
          available: 0,
          revenue: 0,
        }));

  if (data.length === 0) {
    return <p className="panel-caption">No booth or event telemetry available yet.</p>;
  }

  const width = 560;
  const height = 230;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxBooths = Math.max(
    4,
    ...data.map((d) => d.booked + d.pending + d.available)
  );
  const maxRevenue = Math.max(5000, ...data.map((d) => d.revenue));

  const groupW = plotW / data.length;
  const barW = Math.min(44, groupW * 0.48);

  const revenuePoints = data.map((d, i) => {
    const cx = padLeft + i * groupW + groupW / 2;
    const cy = padTop + plotH - (d.revenue / maxRevenue) * plotH;
    return { cx, cy, ...d };
  });

  const polylinePts = revenuePoints.map((p) => `${p.cx},${p.cy}`).join(' ');
  const activeItem = hoveredIndex !== null ? revenuePoints[hoveredIndex] : null;

  return (
    <div className="chart-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block' }}
        role="img"
        aria-label="Zone booth occupancy and revenue chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padTop + plotH - t * plotH;
          const val = Math.round(t * maxBooths);
          return (
            <g key={t}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e4e4e7"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10.5"
                fill="#71717a"
                fontFamily="JetBrains Mono, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {revenuePoints.map((item, idx) => {
          const total = item.booked + item.pending + item.available;
          const x = item.cx - barW / 2;
          const availH = (item.available / maxBooths) * plotH;
          const pendH = (item.pending / maxBooths) * plotH;
          const bookedH = (item.booked / maxBooths) * plotH;

          const yBooked = padTop + plotH - bookedH;
          const yPend = yBooked - pendH;
          const yAvail = yPend - availH;

          return (
            <g
              key={item.label}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={padLeft + idx * groupW}
                y={padTop}
                width={groupW}
                height={plotH}
                fill={hoveredIndex === idx ? 'rgba(249, 115, 22, 0.06)' : 'transparent'}
              />
              {total > 0 && (
                <>
                  <rect
                    x={x}
                    y={yAvail}
                    width={barW}
                    height={Math.max(0, availH)}
                    fill="#e4e4e7"
                    rx="2"
                  />
                  <rect
                    x={x}
                    y={yPend}
                    width={barW}
                    height={Math.max(0, pendH)}
                    fill="#52525b"
                  />
                  <rect
                    x={x}
                    y={yBooked}
                    width={barW}
                    height={Math.max(0, bookedH)}
                    fill="#f97316"
                    rx="2"
                  />
                </>
              )}
              <text
                x={item.cx}
                y={height - 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight={hoveredIndex === idx ? '700' : '500'}
                fill={hoveredIndex === idx ? '#09090b' : '#52525b'}
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {revenuePoints.length > 1 && (
          <polyline
            fill="none"
            stroke="#09090b"
            strokeWidth="2"
            points={polylinePts}
          />
        )}

        {revenuePoints.map((pt, idx) => (
          <circle
            key={`node-${pt.label}`}
            cx={pt.cx}
            cy={pt.cy}
            r={hoveredIndex === idx ? 5 : 3.5}
            fill="#ffffff"
            stroke="#09090b"
            strokeWidth="2"
          />
        ))}
      </svg>

      {activeItem && (
        <div className="chart-tooltip">
          <strong>{activeItem.label}</strong>
          <span className="tabular-nums">
            Booked: <strong style={{ color: '#f97316' }}>{activeItem.booked}</strong> · Pending:{' '}
            {activeItem.pending} · Open: {activeItem.available}
          </span>
          <span className="mono">
            Revenue: ${activeItem.revenue.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

export function BoothAllocationDonut({ booths = [] }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const counts = booths.reduce(
    (acc, b) => {
      const s = (b.status || 'Available').toLowerCase();
      if (s === 'booked' || s === 'reserved') acc.booked += 1;
      else if (s === 'pending') acc.pending += 1;
      else acc.available += 1;
      return acc;
    },
    { booked: 0, pending: 0, available: 0 }
  );

  const total = counts.booked + counts.pending + counts.available;
  const occupancyPct = total > 0 ? Math.round((counts.booked / total) * 100) : 0;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { key: 'booked', label: 'Booked', count: counts.booked, color: '#f97316' },
    { key: 'pending', label: 'Pending', count: counts.pending, color: '#3f3f46' },
    { key: 'available', label: 'Available', count: counts.available, color: '#e4e4e7' },
  ];

  let cumulativeFraction = 0;
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.count / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeFraction * circumference;
    cumulativeFraction += fraction;
    return { ...seg, strokeDasharray, strokeDashoffset };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width="150" height="150" viewBox="0 0 150 150" aria-label="Booth status distribution">
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth="18"
        />
        {total > 0 &&
          arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={hoveredSlice === arc.key ? 21 : 18}
              strokeDasharray={arc.strokeDasharray}
              strokeDashoffset={arc.strokeDashoffset}
              transform="rotate(-90 75 75)"
              style={{ transition: 'stroke-width 150ms ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredSlice(arc.key)}
              onMouseLeave={() => setHoveredSlice(null)}
            />
          ))}
        <text
          x="75"
          y="71"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="#09090b"
          fontFamily="JetBrains Mono, monospace"
        >
          {occupancyPct}%
        </text>
        <text
          x="75"
          y="89"
          textAnchor="middle"
          fontSize="11"
          fill="#71717a"
          fontWeight="600"
        >
          Booked
        </text>
      </svg>

      <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredSlice(seg.key)}
              onMouseLeave={() => setHoveredSlice(null)}
              style={{ display: 'flex', flexDirection: 'column', gap: 4, cursor: 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 2,
                      background: seg.color,
                      display: 'inline-block',
                    }}
                  />
                  {seg.label}
                </span>
                <span className="mono" style={{ color: '#52525b' }}>
                  {seg.count} ({pct}%)
                </span>
              </div>
              <div style={{ height: 5, background: '#f4f4f5', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: seg.color === '#e4e4e7' ? '#a1a1aa' : seg.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const truncateLabel = (text, maxChars) => {
  if (!text) return '';
  return text.length > maxChars ? `${text.slice(0, maxChars - 1).trimEnd()}…` : text;
};

const formatHourLabel = (decimalHour) => {
  const hrs = Math.floor(decimalHour);
  const mins = Math.round((decimalHour - hrs) * 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export function SessionTimelineGraph({ schedule = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!schedule || schedule.length === 0) {
    return <p className="panel-caption">Add sessions to visualize the event timeline graph.</p>;
  }

  const parsed = schedule.map((s, idx) => {
    const start = s.startTime ? new Date(s.startTime) : null;
    const end = s.endTime ? new Date(s.endTime) : null;
    const startHour =
      start && !Number.isNaN(start.getTime())
        ? start.getUTCHours() + start.getUTCMinutes() / 60
        : 9 + idx * 1.5;
    const endHour =
      end && !Number.isNaN(end.getTime())
        ? Math.max(startHour + 0.5, end.getUTCHours() + end.getUTCMinutes() / 60)
        : startHour + 1;
    return {
      ...s,
      startHour: Math.max(8, Math.min(18.5, startHour)),
      endHour: Math.max(8.5, Math.min(19, endHour)),
    };
  });

  const minH = 8;
  const maxH = 19;
  const width = 620;
  const rowH = 38;
  const padTop = 28;
  const padLeft = 175;
  const padRight = 24;
  const plotW = width - padLeft - padRight;
  const height = padTop + parsed.length * rowH + 16;

  const activeSession = hoveredIdx !== null ? parsed[hoveredIdx] : null;

  return (
    <div className="chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          {parsed.map((item, idx) => {
            const x1 = padLeft + ((item.startHour - minH) / (maxH - minH)) * plotW;
            const x2 = padLeft + ((item.endHour - minH) / (maxH - minH)) * plotW;
            const barW = Math.max(24, x2 - x1);
            const y = padTop + idx * rowH + 5;
            return (
              <clipPath key={`clip-${item._id || idx}`} id={`timeline-bar-clip-${idx}`}>
                <rect x={x1} y={y} width={barW} height={24} rx="4" />
              </clipPath>
            );
          })}
        </defs>

        {[8, 10, 12, 14, 16, 18].map((hr) => {
          const x = padLeft + ((hr - minH) / (maxH - minH)) * plotW;
          return (
            <g key={hr}>
              <line x1={x} y1={padTop - 6} x2={x} y2={height - 10} stroke="#e4e4e7" strokeWidth="1" />
              <text
                x={x}
                y={14}
                textAnchor="middle"
                fontSize="10.5"
                fill="#71717a"
                fontFamily="JetBrains Mono, monospace"
              >
                {String(hr).padStart(2, '0')}:00
              </text>
            </g>
          );
        })}

        {parsed.map((item, idx) => {
          const y = padTop + idx * rowH + 5;
          const x1 = padLeft + ((item.startHour - minH) / (maxH - minH)) * plotW;
          const x2 = padLeft + ((item.endHour - minH) / (maxH - minH)) * plotW;
          const barW = Math.max(24, x2 - x1);
          const isKeynote = (item.sessionTitle || '').toLowerCase().includes('keynote') || idx === 0;
          const barLabel = item.speakerName || item.locationDetails || 'Scheduled';
          const fitsInside = barLabel.length * 6.4 + 16 <= barW;
          const rightSpace = width - padRight - (x1 + barW + 8);
          const maxOutsideChars = Math.max(10, Math.floor(rightSpace / 6.4));

          return (
            <g
              key={item._id || idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={0}
                y={y - 4}
                width={width}
                height={rowH - 4}
                rx="4"
                fill={hoveredIdx === idx ? 'rgba(249, 115, 22, 0.05)' : 'transparent'}
              />

              <text
                x={padLeft - 12}
                y={y + 15.5}
                textAnchor="end"
                fontSize="11.5"
                fontWeight="600"
                fill="#09090b"
              >
                {truncateLabel(item.sessionTitle || `Session ${idx + 1}`, 24)}
              </text>

              <rect
                x={x1}
                y={y}
                width={barW}
                height={24}
                rx="4"
                fill={isKeynote ? '#f97316' : hoveredIdx === idx ? '#3f3f46' : '#18181b'}
              />

              {fitsInside ? (
                <text
                  x={x1 + 8}
                  y={y + 15.5}
                  fontSize="10.5"
                  fontWeight="600"
                  fill="#ffffff"
                  clipPath={`url(#timeline-bar-clip-${idx})`}
                >
                  {barLabel}
                </text>
              ) : (
                <text
                  x={x1 + barW + 8}
                  y={y + 15.5}
                  fontSize="10.5"
                  fontWeight="600"
                  fill="#52525b"
                >
                  {truncateLabel(barLabel, maxOutsideChars)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {activeSession && (
        <div className="chart-tooltip">
          <strong>{activeSession.sessionTitle || 'Scheduled Session'}</strong>
          <span>
            {activeSession.speakerName || 'Speaker TBA'}
            {activeSession.locationDetails ? ` · ${activeSession.locationDetails}` : ''}
          </span>
          <span className="mono" style={{ color: '#f97316' }}>
            {formatHourLabel(activeSession.startHour)} – {formatHourLabel(activeSession.endHour)}
          </span>
        </div>
      )}
    </div>
  );
}

export function ZonePriceSparkChart({ booths = [] }) {
  const zones = new Map();
  booths.forEach((b) => {
    const z = b.zone || 'Main Hall';
    if (!zones.has(z)) {
      zones.set(z, { zone: z, total: 0, open: 0, totalPrice: 0 });
    }
    const entry = zones.get(z);
    entry.total += 1;
    entry.totalPrice += Number(b.price) || 2500;
    if ((b.status || 'Available').toLowerCase() === 'available') {
      entry.open += 1;
    }
  });

  const rows = Array.from(zones.values());
  if (rows.length === 0) {
    return <p className="panel-caption">Select an event with booths to inspect zone pricing.</p>;
  }

  const maxAvgPrice = Math.max(1000, ...rows.map((r) => Math.round(r.totalPrice / r.total)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((row) => {
        const avgPrice = Math.round(row.totalPrice / row.total);
        const pct = Math.round((avgPrice / maxAvgPrice) * 100);
        const hasOpen = row.open > 0;
        return (
          <div key={row.zone} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#09090b' }}>{row.zone}</span>
              <span className="mono" style={{ color: '#52525b' }}>
                {row.open}/{row.total} open · avg ${avgPrice.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 8, background: '#f4f4f5', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: hasOpen ? '#f97316' : '#27272a',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}