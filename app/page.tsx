"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import Script from "next/script";
import { apiClient } from "@/lib/api";
import {
  getRazorpayKeyId,
  isRazorpayLoaded,
  createRazorpayCheckout,
  getDefaultRazorpayOptions,
} from "@/lib/utils/razorpay-client";
import type {
  RazorpayPaymentResponse,
} from "@/lib/types/razorpay";
import GameInterface from "@/components/game/GameInterface";

export default function LandingPage() {
  const { isAuthenticated, user, logout, isLoading, checkAuth } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const router = useRouter();

  const isVip = user?.isVip || user?.isPremium;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
  };

  const handleBecomeVip = async () => {
    console.log("Become VIP button clicked");
    
    if (!isAuthenticated || !user) {
      console.log("User not authenticated, redirecting to signup");
      router.push("/signup");
      return;
    }

    // Check if Razorpay is loaded
    const razorpayReady = razorpayLoaded && isRazorpayLoaded();
    console.log("Razorpay loaded:", razorpayReady, "State:", razorpayLoaded, "Window:", typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined');

    if (!razorpayReady) {
      console.warn("Razorpay not ready, waiting...");
      // Wait a bit and check again
      setTimeout(() => {
        if (isRazorpayLoaded()) {
          setRazorpayLoaded(true);
          handleBecomeVip(); // Retry
        } else {
          alert("Payment gateway is loading. Please wait a moment and try again.");
        }
      }, 1000);
      return;
    }

    setIsProcessingPayment(true);
    console.log("Creating payment order...");

    try {
      // Create order on backend
      const orderResponse = await apiClient.createPaymentOrder(65500, "INR");
      console.log("Order response:", orderResponse);

      if (!orderResponse.success || !orderResponse.order) {
        throw new Error(orderResponse.message || "Failed to create order");
      }

      const order = orderResponse.order;
      console.log("Order created:", order);

      // Get Razorpay key ID
      let razorpayKeyId: string;
      try {
        razorpayKeyId = getRazorpayKeyId();
        console.log("Razorpay key ID:", razorpayKeyId.substring(0, 10) + "...");
      } catch (error) {
        throw new Error("Razorpay key is not configured. Please contact support.");
      }

      // Initialize Razorpay checkout
      const options = getDefaultRazorpayOptions(
        order.id,
        order.amount,
        order.currency,
        async function (response: RazorpayPaymentResponse) {
          console.log("Payment response:", response);
          // Verify payment on backend
          try {
            const verifyResponse = await apiClient.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log("Verification response:", verifyResponse);

            if (verifyResponse.success) {
              alert("Payment successful! Your VIP subscription is now active.");
              // Refresh user data
              await checkAuth();
            } else {
              alert(
                verifyResponse.message ||
                  "Payment verification failed. Please contact support."
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        {
          fullName: user.fullName,
          email: user.email,
        }
      );

      // Ensure key is set
      options.key = razorpayKeyId;

      // Add modal dismiss handler
      options.modal = {
        ondismiss: function () {
          console.log("Razorpay modal dismissed");
          setIsProcessingPayment(false);
        },
      };

      console.log("Opening Razorpay checkout...");
      const razorpay = createRazorpayCheckout(options);
      razorpay.open();
      
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response);
        alert("Payment failed. Please try again.");
        setIsProcessingPayment(false);
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to initiate payment. Please try again."
      );
      setIsProcessingPayment(false);
    }
  };

  const handleStartNow = async () => {
    console.log("Start Now button clicked");
    
    if (!isAuthenticated || !user) {
      console.log("User not authenticated, redirecting to signup");
      router.push("/signup");
      return;
    }

    // Start the game for all authenticated users
    setGameStarted(true);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo size="sm" showText={false} />
          <h1 className="text-white text-xl font-bold">SureShot_Hack</h1>
        </Link>
        <div className="flex gap-3 items-center">
          {isLoading ? (
            <div className="text-white">Loading...</div>
          ) : isAuthenticated ? (
            <>
              <span className="text-white text-sm hidden sm:inline">
                Welcome, {user?.fullName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 bg-primary-dark-gray hover:bg-primary-light-gray rounded-lg text-white font-medium transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 overflow-x-hidden">
        <div className="w-full max-w-md rounded-3xl p-4 sm:p-8 shadow-2xl border border-gray-700/30 backdrop-blur-sm bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 relative overflow-hidden">
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-cyan-500/5 rounded-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* VIP Status */}
            <div className="text-center mb-6">
              {isVip ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Online
                    </span>
                    <span className="text-white text-sm">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    YOU&apos;RE VIP USER 💎
                  </h2>
                  {user?.vipExpiresAt && (
                    <p className="text-sm text-gray-300 mb-2">
                      Expires: {new Date(user.vipExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Online
                    </span>
                    <span className="text-white text-sm">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                    YOU&apos;RE NOT VIP 😔
                  </h2>
                </>
              )}
              {!gameStarted && (
                <p className="text-lg font-semibold text-white mb-6">CLICK TO START</p>
              )}
            </div>

            {/* Game Interface - Show for all authenticated users after game started */}
            {/* TODO: Change back to isVip && gameStarted for production */}
            {gameStarted && (
              <div className="mb-6 bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 rounded-lg p-4 sm:p-6 border-2 border-orange-600 shadow-xl w-full">
                <GameInterface onGameStart={() => setGameStarted(true)} />
              </div>
            )}

            {/* Become VIP Button - Show for non-VIP users */}
            {!isVip && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleBecomeVip}
                  disabled={isProcessingPayment}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 rounded-full text-white font-bold text-base transition-all shadow-lg shadow-purple-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? "Processing..." : "BECOME VIP"}
                </button>
              </div>
            )}

            {/* Start Now Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleStartNow}
                disabled={isProcessingPayment || gameStarted}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-full text-white font-bold text-base transition-all shadow-lg shadow-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment
                  ? "Processing..."
                  : gameStarted
                  ? "GAME STARTED"
                  : "START NOW"}
              </button>
            </div>

          </div>

          {/* Social Media Icons */}
          <div className="flex justify-center gap-4 mt-8">
            <a
              href="#"
              className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              aria-label="WhatsApp"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
              aria-label="Telegram"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/20000/svg"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.87 8.81c-.14.625-.5.778-1.014.484l-2.79-2.053-1.348 1.295c-.156.156-.288.288-.59.288l.21-2.97 5.16-4.66c.225-.2-.05-.31-.348-.11l-6.38 4.02-2.75-.86c-.6-.19-.615-.6.13-.89l10.72-4.13c.5-.19.94.11.78.69z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
              aria-label="YouTube"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>
      </main>

      {/* Razorpay Script */}
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Razorpay script loaded");
          setRazorpayLoaded(true);
        }}
        onError={(e) => {
          console.error("Failed to load Razorpay script:", e);
          alert("Failed to load payment gateway. Please refresh the page.");
        }}
      />
    </div>
  );
}
