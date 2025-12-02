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
import GameSelector from "@/components/game/GameSelector";

export default function LandingPage() {
  const { isAuthenticated, user, logout, isLoading, checkAuth } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [gameResult, setGameResult] = useState<{ number: number; color: string; imageUrl: string } | null>(null);
  const [timer, setTimer] = useState(0);
  const router = useRouter();
  const upiId = "vivekvishvkarma@yesg";

  const isVip = user?.isVip || user?.isPremium;

  // Number images with colors
  const numberImages = [
    { number: 0, color: "red/purple", imageUrl: "/images/0redpurple.png" },
    { number: 1, color: "green", imageUrl: "/images/1green.png" },
    { number: 2, color: "red", imageUrl: "/images/2red.png" },
    { number: 3, color: "green", imageUrl: "/images/3green.png" },
    { number: 4, color: "red", imageUrl: "/images/4red.png" },
    { number: 5, color: "green/purple", imageUrl: "/images/5greenpurple.png" },
    { number: 6, color: "red", imageUrl: "/images/6red.png" },
    { number: 7, color: "green", imageUrl: "/images/7green.png" },
    { number: 8, color: "red", imageUrl: "/images/8red.png" },
    { number: 9, color: "green", imageUrl: "/images/9green.png" },
  ];

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
      const orderResponse = await apiClient.createPaymentOrder(110000, "INR");
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

    // If user is not VIP, trigger payment flow
    if (!isVip) {
      handleBecomeVip();
      return;
    }

    // If timer is active, don't allow clicking
    if (timer > 0) {
      return;
    }

    // User is VIP, start the game
    // Generate random number result
    const randomIndex = Math.floor(Math.random() * numberImages.length);
    const result = numberImages[randomIndex];
    
    setGameResult(result);
    setGameStarted(true);
    setTimer(30); // Start 30 second timer
  };

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            // Timer completed, reset game result
            setGameResult(null);
            setGameStarted(false);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  // Copy UPI ID to clipboard
  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      alert("UPI ID copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy UPI ID:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = upiId;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("UPI ID copied to clipboard!");
      } catch (err) {
        alert("Failed to copy UPI ID. Please copy manually: " + upiId);
      }
      document.body.removeChild(textArea);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    try {
      const link = document.createElement("a");
      link.href = "/images/image.png";
      link.download = "upi-qr-code.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download QR code:", error);
      alert("Failed to download QR code");
    }
  };

  // Copy QR code image
  const copyQRCode = async () => {
    try {
      const response = await fetch("/images/image.png");
      if (!response.ok) {
        throw new Error("QR code image not found");
      }
      const blob = await response.blob();
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        alert("QR code copied to clipboard!");
      } else {
        // Fallback: trigger download instead
        downloadQRCode();
      }
    } catch (error) {
      console.error("Failed to copy QR code:", error);
      alert("Failed to copy QR code. Please download it instead.");
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
            <div className="text-white text-xl font-serif">Loading...</div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto sm:overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black relative">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Visible on all screens */}
      <header className="relative z-10 flex items-center justify-between p-2 sm:p-2.5 md:p-3">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
          <Logo size="sm" showText={false} />
          <h1 className="text-white text-sm sm:text-lg md:text-xl font-serif font-bold">SureShot_Hack</h1>
        </Link>
        <div className="flex gap-1.5 sm:gap-2 items-center">
          {isLoading ? (
            <div className="text-white text-xs sm:text-sm font-serif">Loading...</div>
          ) : isAuthenticated ? (
            <>
              <span className="text-white text-xs sm:text-xs md:text-sm font-serif hidden sm:inline">
                Welcome, {user?.fullName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 sm:px-4 sm:py-1.5 md:px-5 md:py-2 bg-blue-600 sm:bg-red-600 hover:bg-blue-700 sm:hover:bg-red-700 rounded-lg text-white text-xs sm:text-sm md:text-base font-serif font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-2.5 py-1 sm:px-4 sm:py-1.5 md:px-5 md:py-2 bg-primary-dark-gray hover:bg-primary-light-gray rounded-lg text-white text-xs sm:text-sm md:text-base font-serif font-medium transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center h-[calc(100vh-64px)] sm:h-[calc(100vh-68px)] md:h-[calc(100vh-72px)] px-4 sm:px-4 overflow-y-auto sm:overflow-hidden">
        <div className={`w-full h-auto sm:h-auto sm:max-w-sm rounded-2xl sm:rounded-xl ${gameStarted ? 'p-5 sm:p-2.5 md:p-3' : 'p-6 sm:p-2.5 md:p-3'} shadow-[0_0_30px_rgba(59,130,246,0.3),0_0_60px_rgba(59,130,246,0.2)] border border-gray-700/30 backdrop-blur-sm bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 relative overflow-visible flex flex-col justify-center my-4 sm:my-0`}>
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-cyan-500/5 rounded-2xl sm:rounded-xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col justify-center">
            {/* Select Game Button - At the top */}
            {!gameStarted && (
              <div className="flex justify-center mb-6 sm:mb-1.5 md:mb-2">
                <GameSelector 
                  selectedGame={selectedGame} 
                  onGameChange={setSelectedGame} 
                />
              </div>
            )}

            {/* VIP Status */}
            <div className={`text-center ${gameStarted ? 'mb-3 sm:mb-1.5 md:mb-1.5' : 'mb-6 sm:mb-1.5 md:mb-2'}`}>
              {isVip ? (
                <h2 className={`font-serif font-bold text-white mb-2 ${gameStarted ? 'text-2xl sm:text-base md:text-lg' : 'text-3xl sm:text-lg md:text-xl'}`}>
                  YOU&apos;RE VIP USER ★
                </h2>
              ) : (
                <h2 className={`font-serif font-bold text-white mb-2 ${gameStarted ? 'text-2xl sm:text-base md:text-lg' : 'text-3xl sm:text-lg md:text-xl'}`}>
                  YOU&apos;RE NOT VIP ★
                </h2>
              )}
              {!gameStarted && (
                <p className="text-xl sm:text-sm md:text-base font-serif font-semibold text-white mb-6 sm:mb-1.5 md:mb-2">CLICK TO START</p>
              )}
            </div>

            {/* Start Now Button - Shows payment flow for non-VIP, starts game for VIP */}
            <div className={`flex flex-col items-center ${gameStarted ? 'mb-4 sm:mb-1.5 md:mb-1.5' : 'mb-6 sm:mb-2 md:mb-3'}`}>
              <button
                onClick={handleStartNow}
                disabled={isProcessingPayment || timer > 0}
                className="px-8 py-4 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-full text-white font-serif font-bold text-base sm:text-xs transition-all shadow-lg shadow-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment 
                  ? "Processing..." 
                  : timer > 0 
                  ? `WAIT ${timer}s` 
                  : "START NOW"}
              </button>
              {/* {!isVip && ( */}
                {/* <div className="flex flex-col items-center mt-2 w-full max-w-sm"> */}
                  {/* UPI ID with copy button */}
                  {/* <div className="flex items-center gap-2 mb-3">
                    <p className="text-white font-serif text-sm sm:text-xs">Pay here: {upiId}</p>
                    <button
                      onClick={copyUpiId}
                      className="p-1.5 sm:p-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors flex-shrink-0"
                      title="Copy UPI ID"
                      type="button"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div> */}
                  
                  {/* QR Code */}
                  {/* <div className="flex flex-col items-center mb-3"> */}
                    {/* <div className="bg-white p-3 sm:p-1.5 rounded-lg shadow-lg"> */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {/* <img
                        src="/images/image.png"
                        alt="UPI QR Code"
                        className="w-48 h-48 sm:w-36 sm:h-36 object-contain"
                        onError={(e) => {
                          console.error("QR code image not found at /images/image.png");
                          const target = e.currentTarget;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-48 h-48 sm:w-36 sm:h-36 flex items-center justify-center bg-gray-200 rounded">
                                <p class="text-gray-600 text-xs text-center p-3 sm:p-2">QR Code image not found<br/>Please add image.png to /public/images/</p>
                              </div>
                            `;
                          }
                        }}
                      /> */}
                    {/* </div> */}
                    
                    {/* Copy and Download QR buttons */}
                    {/* <div className="flex gap-2 mt-3 sm:mt-1.5">
                      <button
                        onClick={copyQRCode}
                        className="px-4 py-2 sm:px-2.5 sm:py-1 bg-blue-600 hover:bg-blue-700 rounded-lg sm:rounded text-white font-serif text-sm sm:text-xs transition-colors flex items-center gap-2 sm:gap-1"
                        type="button"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy QR
                      </button>
                      <button
                        onClick={downloadQRCode}
                        className="px-4 py-2 sm:px-2.5 sm:py-1 bg-green-600 hover:bg-green-700 rounded-lg sm:rounded text-white font-serif text-sm sm:text-xs transition-colors flex items-center gap-2 sm:gap-1"
                        type="button"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download QR
                      </button>
                    </div> */}
                  {/* </div> */}
               {/*  </div>*/}
              {/* )} */}
            </div>

            {/* Game Result - Show random number icon after game started (VIP only) */}
            {gameStarted && gameResult && isVip && (
              <div className="flex flex-col items-center justify-center mb-5 sm:mb-1.5 md:mb-2">
                <div className="relative w-36 h-36 sm:w-24 md:w-28 sm:h-24 md:h-28 mb-3 sm:mb-1 md:mb-1.5 flex items-center justify-center">
                  {/* Shadow layer behind the coin */}
                  <div className="absolute inset-0 bg-black/30 rounded-full blur-xl scale-110"></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gameResult.imageUrl}
                    alt={`Number ${gameResult.number}`}
                    className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      display: 'block',
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3))'
                    }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.error("Failed to load image:", gameResult.imageUrl);
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback')) {
                        const fallback = document.createElement("div");
                        fallback.className = "fallback w-full h-full flex items-center justify-center bg-gray-700 rounded-lg";
                        fallback.innerHTML = `<span class="text-4xl font-bold text-white">${gameResult.number}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <p className="text-xl sm:text-base md:text-lg font-serif font-bold text-white capitalize mb-1 sm:mb-0.5">
                  {gameResult.color}
                </p>
                {/* Timer display below coin */}
                {timer > 0 && (
                  <p className="text-white font-serif text-sm sm:text-xs opacity-75">
                    {timer}s
                  </p>
                )}
              </div>
            )}

          </div>

          {/* New User Section - Above social icons */}
          <div className={`text-center ${gameStarted ? 'mb-4 sm:mb-1.5 md:mb-1.5' : 'mb-5 sm:mb-1.5 md:mb-2'}`}>
            <p className="text-xl sm:text-sm md:text-base font-serif font-bold text-white mb-4 sm:mb-1.5 md:mb-1.5">NEW USER ?</p>
            <a
              href="https://jalwagame1.link/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-blue-400 hover:bg-blue-500 rounded-full text-white font-serif font-bold text-base sm:text-xs transition-all shadow-md hover:shadow-lg underline"
            >
              Sign Up Jalwa Game
            </a>
          </div>

          {/* Social Media Icons */}
          <div className={`flex justify-center gap-4 sm:gap-1.5 md:gap-2 ${gameStarted ? 'mt-4 sm:mt-1.5 md:mt-1.5' : 'mt-5 sm:mt-1.5 md:mt-2'}`}>
            <a
              href="#"
              className="w-12 h-12 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
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
              className="w-12 h-12 sm:w-8 sm:h-8 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
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
              className="w-12 h-12 sm:w-8 sm:h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
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
