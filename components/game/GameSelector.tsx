"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

interface GameType {
  id: string;
  name: string;
  icon: string;
}

interface GameSelectorProps {
  selectedGame: string;
  onGameChange: (gameType: string) => void;
}

export default function GameSelector({ selectedGame, onGameChange }: GameSelectorProps) {
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGameTypes = async () => {
      try {
        const response = await apiClient.getGameTypes();
        if (response.success && response.data) {
          setGameTypes(response.data);
          if (response.data.length > 0 && !selectedGame) {
            onGameChange(response.data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching game types:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameTypes();
  }, [selectedGame, onGameChange]);

  const selectedGameData = gameTypes.find((g) => g.id === selectedGame);

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg p-4 text-center text-gray-500">
        Loading games...
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-xl p-3 sm:p-4 flex items-center justify-between text-black font-bold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base min-w-0"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{selectedGameData?.icon || "🎯"}</span>
          <span>{selectedGameData?.name || "Select Game"}</span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {gameTypes.map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  onGameChange(game.id);
                  setIsOpen(false);
                }}
                className={`w-full p-4 flex items-center gap-3 text-left hover:bg-gray-100 transition-colors ${
                  selectedGame === game.id ? "bg-blue-50" : ""
                }`}
              >
                <span className="text-xl">{game.icon}</span>
                <span className="font-medium">{game.name}</span>
                {selectedGame === game.id && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

