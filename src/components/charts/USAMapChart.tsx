import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { GeographyData } from "@/lib/api";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida",
  GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
  MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming",
};

type ViewMode = "total" | "clients" | "lawyers";

interface USAMapChartProps {
  data?: GeographyData;
  loading?: boolean;
}

export function USAMapChart({ data: geoData = {}, loading = false }: USAMapChartProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("total");
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 1));
  const handleReset = () => { setZoom(1); setCenter([0, 0]); };

  const maxCount = useMemo(() => {
    return Math.max(
      1,
      ...Object.values(geoData).map((d) =>
        viewMode === "total" ? d.clients + d.lawyers : viewMode === "clients" ? d.clients : d.lawyers
      )
    );
  }, [geoData, viewMode]);

  const getColor = (stateAbbr: string) => {
    const d = geoData[stateAbbr];
    if (!d) return "#f3f4f6";
    const count = viewMode === "total" ? d.clients + d.lawyers : viewMode === "clients" ? d.clients : d.lawyers;
    if (count === 0) return "#f3f4f6";
    const intensity = Math.min(count / maxCount, 1);
    const r = Math.round(238 - intensity * 168);
    const g = Math.round(242 - intensity * 180);
    const b = Math.round(255 - intensity * 100);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Geographic Distribution</CardTitle>
          <div className="flex items-center gap-1">
            {(
              [
                { value: "total", label: "Total" },
                { value: "clients", label: "Clients" },
                { value: "lawyers", label: "Lawyers" },
              ] as { value: ViewMode; label: string }[]
            ).map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={viewMode === opt.value ? "default" : "outline"}
                onClick={() => setViewMode(opt.value)}
                className="h-7 px-2 text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div
            className="relative"
            onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
          >
            <ComposableMap projection="geoAlbersUsa" width={800} height={400} className="w-full max-h-[300px]">
              <ZoomableGroup
                zoom={zoom}
                center={center}
                onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates as [number, number]); setZoom(z); }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const fips = geo.id;
                      const stateAbbr = FIPS_TO_STATE[fips] || "";
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getColor(stateAbbr)}
                          stroke="#fff"
                          strokeWidth={0.5}
                          onMouseEnter={() => setHoveredState(stateAbbr)}
                          onMouseLeave={() => setHoveredState(null)}
                          style={{
                            hover: { fill: "#a78bfa", outline: "none", cursor: "pointer" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>

            {/* Zoom Controls */}
            <div className="absolute right-3 top-3 flex flex-col gap-1">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleZoomIn} title="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleZoomOut} title="Zoom out" disabled={zoom <= 1}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleReset} title="Reset view" disabled={zoom <= 1}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {hoveredState && (
              <div
                className="pointer-events-none fixed z-50 rounded-lg border bg-background px-3 py-2 shadow-md"
                style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
              >
                <p className="text-sm font-semibold">{STATE_NAMES[hoveredState] || hoveredState}</p>
                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <p>Clients: <span className="font-medium text-foreground">{geoData[hoveredState]?.clients || 0}</span></p>
                  <p>Lawyers: <span className="font-medium text-foreground">{geoData[hoveredState]?.lawyers || 0}</span></p>
                </div>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex h-3 w-32 overflow-hidden rounded">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                  <div
                    key={v}
                    className="flex-1"
                    style={{
                      background: `rgb(${Math.round(238 - v * 168)}, ${Math.round(242 - v * 180)}, ${Math.round(255 - v * 100)})`,
                    }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
