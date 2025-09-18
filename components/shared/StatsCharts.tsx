"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface StatsChartsProps {
  data: { name: string; value: number }[];
  title: string;
  color?: string; // single color for bars
}

export default function StatsCharts({ data, title, color = "#D87A6B" }: StatsChartsProps) {
  // Compute bottom margin based on the longest label
  const longestLabelLength = Math.max(...data.map(d => d.name.length));
  const bottomMargin = Math.min(120, 30 + longestLabelLength * 6); // adjust multiplier as needed

  // Compute barSize dynamically based on number of items
  const maxBars = 10; // default max bars to show comfortably
  const barSize = Math.max(20, Math.min(50, 400 / Math.max(data.length, maxBars)));

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: bottomMargin }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-35}          // tilt labels
            textAnchor="end"
            interval={0}         // show all labels
          />
          <YAxis label={{ value: 'Số lượng', angle: -90, position: 'insideLeft', offset: 0 }} />
          <Tooltip formatter={(value) => [value, 'Số lượng']} />
          <Bar dataKey="value" fill={color} barSize={barSize} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
