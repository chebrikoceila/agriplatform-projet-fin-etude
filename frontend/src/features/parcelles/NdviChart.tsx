import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { AnalyticsPoint } from "./types";

interface Props {
  data: AnalyticsPoint[];
}

export const NdviChart = ({ data }: Props) => {
  const cleaned = (data ?? [])
    .filter((d) => d.date && (d.ndvi != null || d.ndwi != null))
    .map((d) => ({
      date: d.date,
      ndvi: d.ndvi != null ? Number(d.ndvi.toFixed(3)) : null,
      ndwi: d.ndwi != null ? Number(d.ndwi.toFixed(3)) : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (cleaned.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Aucune donnée Sentinel-2 disponible sur la période.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cleaned} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => v.slice(5)}
            stroke="hsl(var(--border))"
          />
          <YAxis
            domain={[-0.2, 1]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
          <Line
            type="monotone"
            dataKey="ndvi"
            name="NDVI"
            stroke="hsl(var(--ndvi))"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="ndwi"
            name="NDWI"
            stroke="hsl(var(--ndwi))"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
