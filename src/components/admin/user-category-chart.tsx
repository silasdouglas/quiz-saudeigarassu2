"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

export interface CategoryAccuracyPoint {
  name: string;
  accuracy: number;
  total: number;
}

function barColor(accuracy: number): string {
  if (accuracy >= 70) return "#10b981"; // emerald
  if (accuracy >= 40) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

export function UserCategoryChart({ data }: { data: CategoryAccuracyPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
        Sem respostas registradas ainda.
      </div>
    );
  }

  const height = Math.max(160, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
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
          formatter={(value, _name, item) => [
            `${value}% (${item?.payload?.total ?? 0} resp.)`,
            "Acerto",
          ]}
        />
        <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} maxBarSize={26}>
          {data.map((d, i) => (
            <Cell key={i} fill={barColor(d.accuracy)} />
          ))}
          <LabelList
            dataKey="accuracy"
            position="right"
            formatter={(v) => `${v}%`}
            className="fill-foreground"
            style={{ fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
