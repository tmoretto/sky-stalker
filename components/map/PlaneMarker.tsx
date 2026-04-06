'use client';

import { Marker, Tooltip } from 'react-leaflet';
import { divIcon, type DivIcon } from 'leaflet';
import type { Aircraft } from '@/types';
import { getAircraftSizeClass, type AircraftSizeClass } from '@/lib/adsb/geo';

interface PlaneMarkerProps {
  aircraft: Aircraft;
  isSelected: boolean;
  onClick: () => void;
}

function airlineLogoUrl(icaoCode: string): string {
  return `https://www.flightaware.com/images/airline_logos/90p/${icaoCode}.png`;
}

// Size config per class: [normal, selected]
const SIZE_MAP: Record<AircraftSizeClass, { normal: number; selected: number; logoSize: number; strokeWidth: string }> = {
  small:      { normal: 20, selected: 24, logoSize: 14, strokeWidth: '1' },
  narrowbody: { normal: 30, selected: 36, logoSize: 18, strokeWidth: '0.8' },
  widebody:   { normal: 40, selected: 48, logoSize: 22, strokeWidth: '0.6' },
};

// Color palettes per size class
const COLOR_MAP: Record<AircraftSizeClass, { fill: string; stroke: string; fillSelected: string; strokeSelected: string }> = {
  small:      { fill: '#94a3b8', stroke: '#475569', fillSelected: '#38bdf8', strokeSelected: '#0ea5e9' },
  narrowbody: { fill: '#facc15', stroke: '#92400e', fillSelected: '#38bdf8', strokeSelected: '#0ea5e9' },
  widebody:   { fill: '#f97316', stroke: '#7c2d12', fillSelected: '#38bdf8', strokeSelected: '#0ea5e9' },
};

// SVG paths per size class
const SVG_PATHS: Record<AircraftSizeClass, string> = {
  // Small prop plane — compact silhouette
  small: 'M12 2C11.2 2 10.5 2.7 10.5 3.5V9.2L4 13v1.5l6.5-2V17l-2 1.5V20l3.5-1 3.5 1v-1.5L13.5 17v-4.5L20 14.5V13l-6.5-3.8V3.5C13.5 2.7 12.8 2 12 2z',
  // Narrowbody jet — standard airliner
  narrowbody: 'M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  // Widebody — wider wings, heavier silhouette
  widebody: 'M22 15.5v-2.5l-9-4.5V3a2 2 0 0 0-2-2 2 2 0 0 0-2 2v5.5L0 13v2.5l9-2.5v5L6.5 19.5V22L11 20.5 15.5 22v-2.5L13 18v-5z',
};

function createPlaneIcon(
  heading: number | null,
  isSelected: boolean,
  airline: string | null,
  sizeClass: AircraftSizeClass,
  altitude: number | null,
  onGround: boolean,
): DivIcon {
  const rotation = heading ?? 0;
  const sizeConf = SIZE_MAP[sizeClass];
  const colors = COLOR_MAP[sizeClass];
  const fill = isSelected ? colors.fillSelected : colors.fill;
  const stroke = isSelected ? colors.strokeSelected : colors.stroke;
  const size = isSelected ? sizeConf.selected : sizeConf.normal;
  const half = size / 2;
  const svgPath = SVG_PATHS[sizeClass];

  const logoPx = sizeConf.logoSize;
  const logoImgPx = logoPx - 4;
  const logoHtml = airline
    ? `<div style="position:absolute;bottom:-${logoPx / 2 + 2}px;left:50%;transform:translateX(-50%);
                   width:${logoPx}px;height:${logoPx}px;border-radius:50%;
                   background:#fff url('${airlineLogoUrl(airline)}') center/${logoImgPx}px ${logoImgPx}px no-repeat;
                   box-shadow:0 1px 3px rgba(0,0,0,.7);border:1.5px solid rgba(255,255,255,.9);"></div>`
    : '';

  // Altitude-based glow: 0ft=0 → 45000ft=1
  const altNorm = Math.min(1, Math.max(0, (altitude ?? 0) / 45000));
  let glowFilter: string;
  let trailHtml = '';

  if (onGround) {
    // Ground shadow — dark drop shadow, no glow
    glowFilter = 'drop-shadow(0 2px 4px rgba(0,0,0,.9))';
  } else {
    // Altitude-based glow intensity: higher = brighter green/cyan contrail
    const glowOpacity = (0.3 + altNorm * 0.7).toFixed(2);
    const glowSpread = Math.round(4 + altNorm * 12);
    const glowColor = isSelected
      ? `rgba(56,189,248,${glowOpacity})`   // cyan for selected
      : `rgba(250,250,250,${glowOpacity})`; // white for normal
    glowFilter = `drop-shadow(0 0 ${glowSpread}px ${glowColor}) drop-shadow(0 0 2px rgba(0,0,0,.8))`;

    // Contrail: a fading trail behind the plane (opposite of heading)
    if (altNorm > 0.15) {
      const trailLength = Math.round(12 + altNorm * 30);
      const trailOpacity = (0.1 + altNorm * 0.35).toFixed(2);
      const trailAngle = rotation + 180; // opposite direction
      const trailRad = (trailAngle * Math.PI) / 180;
      const tx = Math.sin(trailRad) * trailLength;
      const ty = -Math.cos(trailRad) * trailLength;
      const trailWidth = sizeClass === 'widebody' ? 3 : sizeClass === 'narrowbody' ? 2 : 1.5;
      trailHtml = `<div style="position:absolute;top:50%;left:50%;width:${trailWidth}px;height:${trailLength}px;
                     transform:translate(-50%,-50%) translate(${tx / 2}px,${ty / 2}px) rotate(${rotation}deg);
                     background:linear-gradient(to bottom, rgba(255,255,255,${trailOpacity}), transparent);
                     border-radius:${trailWidth}px;pointer-events:none;"></div>`;
    }
  }

  // Widebody viewBox is slightly wider
  const viewBox = sizeClass === 'widebody' ? '0 0 22 23' : '0 0 24 24';

  return divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
             ${trailHtml}
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}"
               style="transform:rotate(${rotation}deg);
                      filter:${glowFilter}">
               <path fill="${fill}" stroke="${stroke}" stroke-width="${sizeConf.strokeWidth}"
                 d="${svgPath}"/>
             </svg>
             ${logoHtml}
           </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [half, half],
  });
}

export function PlaneMarker({ aircraft, isSelected, onClick }: PlaneMarkerProps) {
  const sizeClass = getAircraftSizeClass(aircraft.aircraftType);
  const icon = createPlaneIcon(aircraft.heading, isSelected, aircraft.airline, sizeClass, aircraft.altitude, aircraft.onGround);

  return (
    <Marker
      position={[aircraft.lat, aircraft.lon]}
      icon={icon}
      eventHandlers={{ click: onClick }}
      zIndexOffset={isSelected ? 1000 : 0}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
        <div className="font-mono text-[11px] leading-tight" style={{ margin: '-4px -6px' }}>
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-1">
            {aircraft.airline && (
              <img
                src={airlineLogoUrl(aircraft.airline)}
                alt={aircraft.airline}
                width={14}
                height={14}
                className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
                loading="lazy"
              />
            )}
            <span className="font-bold tracking-wide">{aircraft.callsign ?? aircraft.hex.toUpperCase()}</span>
            {aircraft.aircraftType && (
              <span className="text-[10px] text-slate-500">{aircraft.aircraftType}</span>
            )}
          </div>
          <div className="flex gap-3 tabular-nums text-[10px] text-slate-600">
            {aircraft.altitude != null && <span>{aircraft.altitude.toLocaleString()} ft</span>}
            {aircraft.groundSpeed != null && <span>{aircraft.groundSpeed} kts</span>}
            {aircraft.heading != null && <span>{aircraft.heading}°</span>}
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}
