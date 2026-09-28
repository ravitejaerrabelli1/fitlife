"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { fontSize: 11, stroke: "var(--muted)" };

export function WeightChart({
  data,
  unit,
}: {
  data: { date: string; weight: number; average: number }[];
  unit: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={axis} minTickGap={24} />
        <YAxis tick={axis} domain={["auto", "auto"]} unit={` ${unit}`} width={60} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="var(--brand)"
          fill="var(--brand)"
          fillOpacity={0.12}
          name={`Weight (${unit})`}
        />
        <Line
          type="monotone"
          dataKey="average"
          stroke="var(--accent)"
          dot={false}
          name="7-day average"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function IntakeChart({
  data,
  target,
}: {
  data: { date: string; calories: number; protein: number }[];
  target: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={axis} minTickGap={24} />
        <YAxis tick={axis} width={50} />
        <Tooltip />
        <Bar dataKey="calories" fill="var(--brand)" name={`Calories (target ${target})`} />
        <Bar dataKey="protein" fill="var(--protein)" name="Protein (g)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleLineChart({
  data,
  dataKey,
  label,
  color = "var(--brand)",
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  label: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={axis} minTickGap={24} />
        <YAxis tick={axis} width={50} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} name={label} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
