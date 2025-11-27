"use client";

interface TimeIntervalSelectorProps {
  selectedInterval: string;
  onIntervalChange: (interval: string) => void;
}

const intervals = [
  { value: "30s", label: "30 Sec" },
  { value: "1m", label: "1 Min" },
  { value: "5m", label: "5 Min" },
];

export default function TimeIntervalSelector({
  selectedInterval,
  onIntervalChange,
}: TimeIntervalSelectorProps) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center flex-wrap px-1">
      {intervals.map((interval) => (
        <button
          key={interval.value}
          onClick={() => onIntervalChange(interval.value)}
          className={`px-3 py-2 sm:px-6 sm:py-3 rounded-full font-bold transition-all shadow-md text-sm sm:text-base whitespace-nowrap ${
            selectedInterval === interval.value
              ? "bg-yellow-400 text-black shadow-lg ring-2 sm:ring-3 ring-yellow-500 ring-offset-1 ring-offset-orange-500"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          {interval.label}
        </button>
      ))}
    </div>
  );
}

