"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface ChartDataPoint {
  name: string;
  erros: number;
}

export function CategoryErrorChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
        Sem dados de erros registrados ainda.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          interval={0}
          tickFormatter={(v: string) =>
            v.length > 12 ? v.slice(0, 11) + "…" : v
          }
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
          formatter={(value) => [String(value), "Erros"]}
        />
        <Bar dataKey="erros" fill="#86efac" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
