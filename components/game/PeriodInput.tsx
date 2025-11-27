"use client";

import { useState } from "react";

interface PeriodInputProps {
  periodNumber: string;
  onPeriodChange: (period: string) => void;
}

export default function PeriodInput({
  periodNumber,
  onPeriodChange,
}: PeriodInputProps) {
  const handleLast4Numbers = () => {
    // Generate a random 4-digit number for demo
    // In production, this would fetch the actual last period number
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    onPeriodChange(last4);
  };

  return (
    <div className="space-y-3 w-full">
      <label className="block text-black font-bold text-sm uppercase">
        ENTER PERIOD NUMBER
      </label>
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={periodNumber}
          onChange={(e) => onPeriodChange(e.target.value)}
          placeholder="Enter period number"
          className="flex-1 min-w-0 bg-yellow-400 text-black font-bold px-3 sm:px-4 py-2 sm:py-3 rounded-xl placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 shadow-md text-sm sm:text-base"
        />
        <button
          onClick={handleLast4Numbers}
          className="bg-yellow-400 text-black font-bold px-2 sm:px-4 py-2 sm:py-3 rounded-xl hover:bg-yellow-500 transition-colors whitespace-nowrap text-xs sm:text-sm shadow-md hover:shadow-lg flex-shrink-0"
        >
          <span className="hidden sm:inline">LAST 4 NUMBER</span>
          <span className="sm:hidden">LAST 4</span>
        </button>
      </div>
    </div>
  );
}

