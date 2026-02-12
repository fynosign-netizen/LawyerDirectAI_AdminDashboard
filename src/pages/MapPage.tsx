import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { api, type GeographyData } from "@/lib/api";
import { USAMapChart } from "@/components/charts/USAMapChart";

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

// Reverse lookup: full state name → 2-letter code
const STATE_NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

/** Normalize a state key to a 2-letter code, merging duplicates */
function normalizeGeoData(raw: GeographyData): GeographyData {
  const merged: GeographyData = {};
  for (const [key, value] of Object.entries(raw)) {
    const trimmed = key.trim();
    let abbr: string;
    if (/^[A-Z]{2}$/.test(trimmed)) {
      abbr = trimmed;
    } else {
      abbr = STATE_NAME_TO_ABBR[trimmed.toLowerCase()] || trimmed;
    }
    if (!merged[abbr]) {
      merged[abbr] = { clients: 0, lawyers: 0 };
    }
    merged[abbr].clients += value.clients;
    merged[abbr].lawyers += value.lawyers;
  }
  return merged;
}

export default function MapPage() {
  const [geoData, setGeoData] = useState<GeographyData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: GeographyData }>("/admin/geography")
      .then((res) => setGeoData(normalizeGeoData(res.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sortedStates = useMemo(() => {
    return Object.entries(geoData)
      .map(([state, data]) => ({
        state,
        name: STATE_NAMES[state] || state,
        clients: data.clients,
        lawyers: data.lawyers,
        total: data.clients + data.lawyers,
      }))
      .sort((a, b) => b.total - a.total);
  }, [geoData]);

  const totalClients = Object.values(geoData).reduce((sum, d) => sum + d.clients, 0);
  const totalLawyers = Object.values(geoData).reduce((sum, d) => sum + d.lawyers, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Geographic Distribution</h1>
        <p className="text-sm text-muted-foreground">Users and lawyers by state across the USA</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tracked</p>
                <p className="text-2xl font-semibold">{totalClients + totalLawyers}</p>
              </div>
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Clients</p>
            <p className="text-2xl font-semibold text-blue-600">{totalClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Lawyers</p>
            <p className="text-2xl font-semibold text-indigo-600">{totalLawyers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <USAMapChart data={geoData} loading={loading} />

      {/* Top States Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top States</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">State</th>
                  <th className="pb-2 font-medium">Clients</th>
                  <th className="pb-2 font-medium">Lawyers</th>
                  <th className="pb-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedStates.slice(0, 15).map((row, i) => (
                  <tr key={row.state}>
                    <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-3 font-medium">
                      {row.name} <span className="text-xs text-muted-foreground">({row.state})</span>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">{row.clients}</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">{row.lawyers}</Badge>
                    </td>
                    <td className="py-2 font-medium">{row.total}</td>
                  </tr>
                ))}
                {sortedStates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No geographic data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
