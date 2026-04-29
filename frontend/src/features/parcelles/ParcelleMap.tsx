import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Parcelle, ParcelleGeometry } from "./types";
import { getCropStatus } from "./types";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const statusColor = (ndvi?: number) => {
  const s = getCropStatus(ndvi);
  switch (s) {
    case "good": return "#22c55e"; // vert
    case "medium": return "#f59e0b"; // orange
    case "stressed": return "#ef4444"; // rouge (terre sèche)
    default: return "#94a3b8"; // gris
  }
};

interface DrawControllerProps {
  drawing: boolean;
  onCreated: (geom: ParcelleGeometry) => void;
}

const DrawController = ({ drawing, onCreated }: DrawControllerProps) => {
  const map = useMap();

  useEffect(() => {
    map.pm.setGlobalOptions({
      pathOptions: {
        color: "hsl(142 60% 45%)",
        weight: 2.5,
        fillColor: "hsl(142 60% 45%)",
        fillOpacity: 0.18,
      },
      snappable: true,
      allowSelfIntersection: false,
    });

    map.pm.setLang("fr");

  const handleCreate = (e: any) => {
  const layer = e.layer as L.Polygon;
  let geom: ParcelleGeometry | null = null;
  try {
    const gj = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
    geom = { type: "Polygon", coordinates: gj.geometry.coordinates };
  } catch (err) {
    console.error("[ParcelleMap] toGeoJSON failed", err);
    return;
  }
  // Defer cleanup + state update so Geoman finishes its internal event
  // handling before React re-renders / disables draw mode (avoids crash).
  setTimeout(() => {
    try {
      if (map.hasLayer(layer)) map.removeLayer(layer);
      if (map.pm.globalDrawModeEnabled()) map.pm.disableDraw();
    } catch (err) {
      console.warn("[ParcelleMap] cleanup warning", err);
    }
    if (geom) onCreated(geom);
  }, 0);
};


    map.on("pm:create", handleCreate);
    return () => {
      map.off("pm:create", handleCreate);
    };
  }, [map, onCreated]);

  useEffect(() => {
  try {
    if (drawing) {
      if (!map.pm.globalDrawModeEnabled()) {
        map.pm.enableDraw("Polygon", { snappable: true, finishOn: "dblclick" });
      }
    } else if (map.pm.globalDrawModeEnabled()) {
      map.pm.disableDraw();
    }
  } catch (err) {
    console.warn("[ParcelleMap] draw toggle warning", err);
  }
}, [drawing, map]);


  return null;
};

interface FitBoundsProps {
  parcelles: Parcelle[];
  selectedId: string | null;
}

const FitBounds = ({ parcelles, selectedId }: FitBoundsProps) => {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (selectedId) {
      const p = parcelles.find((x) => x._id === selectedId);
      if (!p) return;
      const layer = L.geoJSON(p.geometry as any);
      map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 16 });
      return;
    }
    if (!fittedRef.current && parcelles.length > 0) {
      const group = L.featureGroup(parcelles.map((p) => L.geoJSON(p.geometry as any)));
      try {
        map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 14 });
        fittedRef.current = true;
      } catch { /* ignore */ }
    }
  }, [map, parcelles, selectedId]);

  return null;
};

interface ParcelleMapProps {
  parcelles: Parcelle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  drawing: boolean;
  onCreated: (geom: ParcelleGeometry) => void;
}

export const ParcelleMap = ({
  parcelles,
  selectedId,
  onSelect,
  drawing,
  onCreated,
}: ParcelleMapProps) => {
  return (
    <MapContainer
      center={[31.7917, -7.0926]} // Maroc - centre par défaut
      zoom={6}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        opacity={0.7}
      />

      <DrawController drawing={drawing} onCreated={onCreated} />
      <FitBounds parcelles={parcelles} selectedId={selectedId} />

  {parcelles.map((p) => {
  const isSelected = p._id === selectedId;
  const baseColor = statusColor(p.ndviMoyen);
  const baseStyle = {
    color: baseColor,
    weight: isSelected ? 3.5 : 2,
    fillColor: baseColor,
    fillOpacity: isSelected ? 0.4 : 0.18,
    dashArray: isSelected ? undefined : "4 4",
  };
  return (
    <GeoJSON
      key={p._id}
      data={p.geometry as any}
      style={() => baseStyle}
      eventHandlers={{
        click: () => onSelect(p._id),
        add: (e) => { (e.target as L.Path).setStyle(baseStyle); },
        mouseover: (e) => { (e.target as L.Path).setStyle({ fillOpacity: 0.45, weight: 3 }); },
        mouseout: (e) => { (e.target as L.Path).setStyle(baseStyle); },
      }}
    />
  );
})}
    </MapContainer>
  );
};
