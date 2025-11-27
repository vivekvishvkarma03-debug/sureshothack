"use client";

import { useState } from "react";

interface PredictionButtonsProps {
  onPredictionSelect: (prediction: string) => void;
  selectedPrediction?: string;
}

const numberPredictions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const colorPredictions = [
  { value: "SMALL GREEN", label: "SMALL GREEN", color: "green" },
  { value: "BIG RED", label: "BIG RED", color: "red" },
];

export default function PredictionButtons({
  onPredictionSelect,
  selectedPrediction,
}: PredictionButtonsProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Number Predictions */}
      <div className="grid grid-cols-5 gap-2 w-full">
        {numberPredictions.map((num) => (
          <button
            key={num}
            onClick={() => onPredictionSelect(num)}
            className={`relative bg-red-600 text-white font-bold py-3 sm:py-4 px-1 sm:px-2 rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base min-w-0 aspect-square flex items-center justify-center ${
              selectedPrediction === num ? "ring-2 sm:ring-3 ring-yellow-400 ring-offset-1 ring-offset-orange-500" : ""
            }`}
          >
            {num === "3" && (
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-md z-10">
                3
              </div>
            )}
            <span className="relative z-0">{num}</span>
          </button>
        ))}
      </div>

      {/* Color Predictions */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {colorPredictions.map((pred) => (
          <button
            key={pred.value}
            onClick={() => onPredictionSelect(pred.value)}
            className={`bg-red-600 text-white font-bold py-3 sm:py-4 px-2 sm:px-4 rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm min-w-0 ${
              selectedPrediction === pred.value ? "ring-2 sm:ring-3 ring-yellow-400 ring-offset-1 ring-offset-orange-500" : ""
            }`}
          >
            <span className={pred.color === "green" ? "text-green-300" : "text-red-300"}>
              {pred.label.split(" ")[0]}
            </span>{" "}
            <span className={pred.color === "green" ? "text-green-400 font-extrabold" : "text-red-400 font-extrabold"}>
              {pred.label.split(" ")[1]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

