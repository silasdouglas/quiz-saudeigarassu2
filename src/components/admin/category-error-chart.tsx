"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export interface ChartDataPoint {
  name: string;
  erros: number;
}

// Wrap a long category name into multiple short lines so the full label fits
// under each bar without being truncated.
function wrapLabel(text: string, maxChars = 14): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function CategoryTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const lines = wrapLabel(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${(y ?? 0) + 12})`}>
      <text textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
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
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: -24, bottom: 56 }}>
        <defs>
          {/* Degradê vertical: escuro em cima, claro embaixo */}
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-border"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          interval={0}
          height={56}
          tick={<CategoryTick />}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ className: "fill-muted/40" }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--popover-foreground)" }}
          formatter={(value) => [String(value), "Erros"]}
        />
        <Bar
          dataKey="erros"
          fill="url(#barGradient)"
          radius={[4, 4, 0, 0]}
          maxBarSize={56}
        >
          <LabelList
            dataKey="erros"
            position="top"
            className="fill-foreground"
            style={{ fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
