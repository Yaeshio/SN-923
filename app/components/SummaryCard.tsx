// app/dashboard/components/SummaryCard.tsx
import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  valueColor?: string;
}

export function SummaryCard({ title, value, valueColor = 'text-gray-800' }: SummaryCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center">
      <div>
        <p className="text-lg text-gray-500">{title}</p>
        <p className={`text-5xl font-extrabold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
