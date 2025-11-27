"use client";

import { useState, useEffect } from "react";
import GameSelector from "./GameSelector";
import TimeIntervalSelector from "./TimeIntervalSelector";
import PeriodInput from "./PeriodInput";
import PredictionButtons from "./PredictionButtons";
import { apiClient } from "@/lib/api";

interface GameInterfaceProps {
  onGameStart?: () => void;
}

export default function GameInterface({ onGameStart }: GameInterfaceProps) {
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedInterval, setSelectedInterval] = useState<string>("1m");
  const [periodNumber, setPeriodNumber] = useState<string>("");
  const [selectedPrediction, setSelectedPrediction] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Fetch current period when game or interval changes
  useEffect(() => {
    if (selectedGame) {
      fetchCurrentPeriod();
    }
  }, [selectedGame, selectedInterval]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchCurrentPeriod = async () => {
    try {
      const response = await apiClient.getGamePeriods(selectedGame);
      if (response.success && response.data && response.data.length > 0) {
        const period = response.data[0];
        setCurrentPeriod(period);
        setPeriodNumber(period.periodNumber);
        
        // Calculate time remaining
        const closesAt = new Date(period.closesAt);
        const now = new Date();
        const remaining = Math.max(0, Math.floor((closesAt.getTime() - now.getTime()) / 1000));
        setTimeRemaining(remaining);
      }
    } catch (error) {
      console.error("Error fetching period:", error);
    }
  };

  const handleStartGame = async () => {
    if (!selectedGame || !selectedInterval) {
      alert("Please select a game and time interval");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.startGame(selectedGame, selectedInterval);
      if (response.success && response.data) {
        setCurrentPeriod(response.data.period);
        setPeriodNumber(response.data.period.periodNumber);
        
        const closesAt = new Date(response.data.closesAt);
        const now = new Date();
        const remaining = Math.max(0, Math.floor((closesAt.getTime() - now.getTime()) / 1000));
        setTimeRemaining(remaining);
        
        if (onGameStart) {
          onGameStart();
        }
      } else {
        alert(response.message || "Failed to start game");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to start game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPrediction = async () => {
    if (!selectedGame || !periodNumber || !selectedPrediction) {
      alert("Please fill in all fields and select a prediction");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.submitPrediction({
        gameType: selectedGame,
        periodNumber,
        prediction: selectedPrediction,
        timeInterval: selectedInterval,
      });

      if (response.success) {
        alert("Prediction submitted successfully!");
        setSelectedPrediction("");
      } else {
        alert(response.message || "Failed to submit prediction");
      }
    } catch (error: any) {
      console.error("Error submitting prediction:", error);
      alert(error.message || "Failed to submit prediction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      {/* Game Selector */}
      <div className="w-full">
        <GameSelector selectedGame={selectedGame} onGameChange={setSelectedGame} />
      </div>

      {/* Time Interval Selector */}
      <div className="w-full">
        <TimeIntervalSelector
          selectedInterval={selectedInterval}
          onIntervalChange={setSelectedInterval}
        />
      </div>

      {/* Period Input */}
      <div className="w-full">
        <PeriodInput periodNumber={periodNumber} onPeriodChange={setPeriodNumber} />
      </div>

      {/* Timer Display */}
      {timeRemaining > 0 && (
        <div className="text-center w-full">
          <div className="inline-block bg-green-500 text-white px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm">
            Time Remaining: {formatTime(timeRemaining)}
          </div>
        </div>
      )}

      {/* Prediction Buttons */}
      {periodNumber && (
        <>
          <div className="w-full">
            <PredictionButtons
              onPredictionSelect={setSelectedPrediction}
              selectedPrediction={selectedPrediction}
            />
          </div>

          {/* Submit Prediction Button */}
          {selectedPrediction && (
            <button
              onClick={handleSubmitPrediction}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubmitting ? "Submitting..." : "Submit Prediction"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

