import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const fullUrl = (url) => { if (!url) return ""; if (url.startsWith("http") || url.startsWith("data:")) return url; if (BACKEND.includes("localhost") && !window.location.hostname.includes("localhost")) return ""; return `${BACKEND}${url}`; };

const sathiIcon = (sathi) => {
  const avatar = fullUrl(sathi.avatar);
  const border = sathi.premium ? "#FF6B00" : "#0A0A0A";
  const inner = avatar
    ? `<img src="${avatar}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextSibling.style.display='flex';" /><div style="display:none;width:44px;height:44px;border-radius:50%;background:#FF6B00;align-items:center;justify-content:center;font:900 18px/1 sans-serif;color:white;">${(sathi.name || "S")[0].toUpperCase()}</div>`
    : `<div style="width:44px;height:44px;border-radius:50%;background:#FF6B00;display:flex;align-items:center;justify-content:center;font:900 18px/1 sans-serif;color:white;">${(sathi.name || "S")[0].toUpperCase()}</div>`;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:52px;height:62px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
      <div style="position:absolute;top:0;left:0;width:52px;height:52px;border-radius:50% 50% 50% 0;background:white;transform:rotate(-45deg);border:3px solid ${border};"></div>
      <div style="position:absolute;top:4px;left:4px;width:44px;height:44px;border-radius:50%;overflow:hidden;border:2px solid ${border};">${inner}</div>
    </div>`,
    iconSize: [52, 62], iconAnchor: [26, 62], popupAnchor: [0, -58],
  });
};

const plazaIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:38px;height:46px;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.35));">
    <div style="position:absolute;top:0;left:0;width:38px;height:38px;border-radius:50% 50% 50% 0;background:#FFD60A;transform:rotate(-45deg);border:3px solid #0A0A0A;"></div>
    <div style="position:absolute;top:5px;left:5px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5-4-3.5z"/>
        <path d="M12 13v8"/>
        <path d="M12 2v4"/>
      </svg>
    </div>
  </div>`,
  iconSize: [38, 46], iconAnchor: [19, 46], popupAnchor: [0, -42],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>
  </div>`,
  iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -8],
});

const centerIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:44px;height:52px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
    <div style="position:absolute;top:0;left:0;width:44px;height:44px;border-radius:50% 50% 50% 0;background:#FF6B00;transform:rotate(-45deg);border:3px solid #0A0A0A;"></div>
    <div style="position:absolute;top:6px;left:6px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    </div>
  </div>`,
  iconSize: [44, 52], iconAnchor: [22, 52], popupAnchor: [0, -48],
});

export default function MapView({ center, sathis = [], plazas = [], userPos, radiusKm = 25, height = 480, onSathiClick, onPlazaClick, static: isStatic = false }) {
  return (
    <div data-testid="map-view" style={{ height, width: "100%", borderRadius: 24, overflow: "hidden", border: "2px solid #0A0A0A", pointerEvents: isStatic ? "none" : "auto" }}>
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={!isStatic} dragging={!isStatic} zoomControl={!isStatic} doubleClickZoom={!isStatic} touchZoom={!isStatic} keyboard={!isStatic}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPos && (
          <>
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
              <Popup><b>You are here</b></Popup>
            </Marker>
            <Circle center={[userPos.lat, userPos.lng]} radius={radiusKm * 1000} pathOptions={{ color: "#FF6B00", fillColor: "#FF6B00", fillOpacity: 0.06, weight: 1, dashArray: "4 6" }} />
          </>
        )}

        {plazas.map((p) => (
          <Marker key={p.slug} position={[p.lat, p.lng]} icon={plazaIcon}
            eventHandlers={{ click: () => onPlazaClick?.(p) }}>
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>{p.highway} · {p.city}</div>
                <div style={{ fontSize: 11, marginTop: 6 }}>Car ₹{p.carRate} · Truck ₹{p.truckRate}</div>
                <a href={`/toll/${p.slug}`} style={{ display: "inline-block", marginTop: 8, background: "#FF6B00", color: "#fff", padding: "4px 10px", borderRadius: 999, fontWeight: 700, fontSize: 11, textDecoration: "none" }}>View plaza</a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Apnafastag Centers — sathis who have an active center location */}
        {sathis.filter((s) => s.center?.active && s.center?.lat && s.center?.lng).map((s) => (
          <Marker key={`center-${s.slug}`} position={[s.center.lat, s.center.lng]} icon={centerIcon}>
            <Popup>
              <div style={{ minWidth: 220 }}>
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: "#FF6B00", marginBottom: 4 }}>Apnafastag Center</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{s.center.name || `${s.name}'s Center`}</div>
                {s.center.address && <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>{s.center.address}</div>}
                {s.center.hours  && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>🕐 {s.center.hours}</div>}
                <a href={`/sathi/${s.slug}`} style={{ display: "inline-block", marginTop: 8, background: "#FF6B00", color: "#fff", padding: "4px 10px", borderRadius: 999, fontWeight: 700, fontSize: 11, textDecoration: "none" }}>View Sathi</a>
              </div>
            </Popup>
          </Marker>
        ))}

        {(() => {
          // Group sathis by coordinate, then spread duplicates in a circle
          const seen = {};
          return sathis.map((s) => {
            const key = `${s.lat?.toFixed(3)},${s.lng?.toFixed(3)}`;
            const idx = seen[key] ?? 0;
            seen[key] = idx + 1;
            const angle = (idx * 137.5 * Math.PI) / 180; // golden-angle spread
            const radius = idx === 0 ? 0.003 : 0.005;
            const lat = s.lat + radius * Math.cos(angle);
            const lng = s.lng + radius * Math.sin(angle);
            return (
          <Marker key={s.slug} position={[lat, lng]} icon={sathiIcon(s)}
            eventHandlers={{ click: () => onSathiClick?.(s) }}>
            <Popup>
              <div style={{ minWidth: 220 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {s.avatar
                    ? <img src={fullUrl(s.avatar)} alt={s.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FF6B00", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 16 }}>{(s.name || "S")[0]}</div>
                  }
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name} {s.verified && <span style={{ color: "#059669" }}>✓</span>}</div>
                    <div style={{ fontSize: 11, color: "#4B5563" }}>★ {s.rating} · {s.reviewCount} reviews</div>
                  </div>
                </div>
                {typeof s.distKm === "number" && <div style={{ fontSize: 11, color: "#FF6B00", fontWeight: 700, marginTop: 6 }}>{s.distKm.toFixed(1)} km away</div>}
                <a href={`/sathi/${s.slug}`} style={{ display: "inline-block", marginTop: 8, background: "#0A0A0A", color: "#fff", padding: "4px 10px", borderRadius: 999, fontWeight: 700, fontSize: 11, textDecoration: "none" }}>View profile</a>
              </div>
            </Popup>
          </Marker>
            );
          });
        })()}
      </MapContainer>
    </div>
  );
}
