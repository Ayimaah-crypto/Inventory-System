


import { useState, useRef, useEffect } from "react";
import { auth } from "../../Firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { FaCalculator } from "react-icons/fa";
import { 
  FiCamera, 
  FiUser, 
  FiLogOut, 
  FiX, 
  FiCheckCircle, 
  FiRefreshCw,
  FiBell,
  FiCalendar,
  FiFileText,
  FiAlertCircle
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useNotifications } from "../../Hooks/useNotifications";

// IMPORT STANDARD CALCULATOR COMPONENT
import StandardCalculator from "../StandardCalculator";

export default function Header({ user: initialUser }) {
  // Sync local active user with Firebase Auth directly
  const [activeUser, setActiveUser] = useState(initialUser || auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setActiveUser(firebaseUser);
      } else {
        setActiveUser(initialUser);
      }
    });

    return () => unsubscribe();
  }, [initialUser]);

  const [showCalculator, setShowCalculator] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Fetch real-time counts from Firestore hook
  const {
    todayRemindersCount,
    unpaidInvoicesCount,
    outOfStockCount,
    totalAlertsCount,
  } = useNotifications();

  // Camera State
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Calculator State
  const [plainCost, setPlainCost] = useState(25);
  const [printCost, setPrintCost] = useState(15);
  const [quantity, setQuantity] = useState(10);
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [marginPercent, setMarginPercent] = useState(40);

  // Calculator Computations
  const totalCost = (Number(plainCost) + Number(printCost)) * Number(quantity) + Number(deliveryFee);
  const profit = totalCost * (Number(marginPercent) / 100);
  const totalQuote = totalCost + profit;
  const unitQuote = totalQuote / (Number(quantity) || 1);

  // --- Camera Operations ---
  const startCamera = async () => {
    setShowCamera(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      alert("Unable to access camera. Please allow camera permissions in your browser.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const closeCameraModal = () => {
    stopCamera();
    setShowCamera(false);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <>
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Dynamic Greeting */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-400 truncate max-w-[150px] sm:max-w-none">
            Welcome back, <strong className="text-black">{activeUser?.displayName || activeUser?.email?.split('@')[0] || "User"}</strong>
          </span>
        </div>

        {/* Quick Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Notifications Dropdown Container */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowProfileMenu(false); // Close profile if open
              }}
              className="relative p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-black transition flex items-center justify-center"
              title="Notifications"
            >
              <FiBell size={18} className="text-zinc-700" />
              {totalAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {totalAlertsCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl p-4 z-50 text-xs">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2 mb-3">
                  <h4 className="font-extrabold uppercase text-black">Alerts & Reminders</h4>
                  <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                    {totalAlertsCount} Pending
                  </span>
                </div>

                <div className="space-y-2">
                  {todayRemindersCount > 0 && (
                    <Link
                      to="/workspace"
                      onClick={() => setShowNotificationMenu(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition"
                    >
                      <div className="flex items-center gap-2">
                        <FiCalendar size={15} className="text-amber-600 shrink-0" />
                        <span>{todayRemindersCount} reminder(s) for today</span>
                      </div>
                    </Link>
                  )}

                  {unpaidInvoicesCount > 0 && (
                    <Link
                      to="/invoices"
                      onClick={() => setShowNotificationMenu(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 text-red-900 border border-red-200 hover:bg-red-100 transition"
                    >
                      <div className="flex items-center gap-2">
                        <FiFileText size={15} className="text-red-600 shrink-0" />
                        <span>{unpaidInvoicesCount} unpaid invoice(s)</span>
                      </div>
                    </Link>
                  )}

                  {outOfStockCount > 0 && (
                    <Link
                      to="/inventory"
                      onClick={() => setShowNotificationMenu(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 transition"
                    >
                      <div className="flex items-center gap-2">
                        <FiAlertCircle size={15} className="text-zinc-600 shrink-0" />
                        <span>{outOfStockCount} low stock item(s)</span>
                      </div>
                    </Link>
                  )}

                  {totalAlertsCount === 0 && (
                    <p className="text-zinc-400 py-3 text-center">No active reminders or alerts!</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Camera Button */}
          <button
            onClick={startCamera}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-black px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition"
            title="Take photo of apparel"
          >
            <FiCamera size={16} className="text-orange-500 shrink-0" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Calculator Button */}
          <button
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-black px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition"
            title="Open pricing calculator"
          >
            <FaCalculator size={16} className="text-orange-500 shrink-0" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          {/* Dynamic User Profile Avatar Menu */}
          {/* Dynamic User Profile Avatar Menu */}
<div className="relative">
  <button
    onClick={() => {
      setShowProfileMenu(!showProfileMenu);
      setShowNotificationMenu(false); // Close notifications if open
    }}
    className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300 flex items-center justify-center transition shadow-xs overflow-hidden border border-zinc-300"
    title="User Profile"
  >
    {activeUser?.photoURL ? (
      <img 
        src={activeUser.photoURL} 
        alt={activeUser?.displayName || "Profile"} 
        className="w-full h-full object-cover" 
      />
    ) : (
      /* Default person icon silhouette */
      <FiUser size={18} className="text-zinc-600" />
    )}
  </button>

  {/* Profile Dropdown */}
  {showProfileMenu && (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
      <div className="px-4 py-2 border-b border-zinc-100">
        <p className="font-bold text-black truncate">{activeUser?.displayName || "User"}</p>
        <p className="text-zinc-400 text-[10px] truncate">{activeUser?.email || "No email provided"}</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-2.5 text-red-600 font-semibold hover:bg-red-50 flex items-center gap-2 transition"
      >
        <FiLogOut size={14} /> Sign Out
      </button>
    </div>
            )}
          </div>

        </div>
      </header>

      {/* --- CAMERA MODAL --- */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={closeCameraModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold text-black flex items-center gap-2">
              <FiCamera className="text-orange-500" /> Item Camera Capture
            </h3>

            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured apparel" className="w-full h-full object-cover" />
              ) : (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex items-center justify-between pt-2">
              {capturedImage ? (
                <>
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition"
                  >
                    <FiRefreshCw /> Retake
                  </button>

                  <a
                    href={capturedImage}
                    download={`item-photo-${Date.now()}.jpg`}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition"
                  >
                    <FiCheckCircle /> Save / Download Image
                  </a>
                </>
              ) : (
                <button
                  onClick={capturePhoto}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Snap Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK PRICING CALCULATOR MODAL --- */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCalculator(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1 z-10"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-4">
              <FaCalculator className="text-orange-500" /> Custom Job Price Calculator
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: Custom Job Pricing Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-zinc-500">Plain Shirt Cost (GH₵)</label>
                    <input
                      type="number"
                      value={plainCost}
                      onChange={(e) => setPlainCost(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-xl bg-zinc-50 focus:outline-none focus:border-orange-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-500">Print / Custom Cost (GH₵)</label>
                    <input
                      type="number"
                      value={printCost}
                      onChange={(e) => setPrintCost(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-xl bg-zinc-50 focus:outline-none focus:border-orange-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-500">Quantity (pcs)</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-xl bg-zinc-50 focus:outline-none focus:border-orange-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-500">Motorbike Drop (GH₵)</label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-xl bg-zinc-50 focus:outline-none focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-zinc-500 text-xs">Target Profit Margin (%)</label>
                  <input
                    type="number"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Total Production Cost:</span>
                    <span className="font-bold">GH₵ {totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Profit ({marginPercent}%):</span>
                    <span className="font-bold text-green-600">+ GH₵ {profit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-orange-200 text-sm font-extrabold text-black">
                    <span>Client Quote Total:</span>
                    <span className="text-orange-600">GH₵ {totalQuote.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 text-right">
                    (Unit price: GH₵ {unitQuote.toFixed(2)} / shirt)
                  </p>
                </div>
              </div>

              {/* Right Column: Standard Keypad Calculator */}
              <div className="flex flex-col items-center md:items-start">
                <h4 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                  Quick Math Keypad
                </h4>
                <StandardCalculator />
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}