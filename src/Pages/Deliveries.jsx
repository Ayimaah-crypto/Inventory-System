import { useState, useEffect } from "react";
import { subscribeToDeliveries, updateDeliveryStatus } from "../Services/deliveryService";
import { 
  FiTruck, 
  FiPhone, 
  FiMapPin, 
  FiCheckCircle, 
  FiNavigation, 
  FiPackage, 
  FiDollarSign,
  FiClock
} from "react-icons/fi";

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToDeliveries((data) => {
      setDeliveries(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (id, status, paymentCollected = false) => {
    try {
      await updateDeliveryStatus(id, status, paymentCollected);
    } catch (err) {
      console.error("Failed to update delivery:", err);
      alert("Error updating status.");
    }
  };

  const activeDrops = deliveries.filter((d) => d.status !== "Delivered");
  const completedToday = deliveries.filter((d) => d.status === "Delivered");

  return (
    <div className="min-h-screen bg-zinc-100 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Motorbike Dispatch</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Active delivery drops and route management.</p>
          </div>

          <div className="bg-orange-500 text-white text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
            <FiTruck size={16} /> {activeDrops.length} Active Drop-offs
          </div>
        </div>

        {/* Dispatch Pipeline List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <FiClock className="text-orange-500" /> Deliveries In Progress
          </h2>

          {loading ? (
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 text-center text-zinc-400 font-medium">
              Loading route queue...
            </div>
          ) : activeDrops.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 text-center text-zinc-400 font-medium">
              No pending deliveries. All drops are clear!
            </div>
          ) : (
            <div className="space-y-4">
              {activeDrops.map((drop) => (
                <div 
                  key={drop.id} 
                  className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm space-y-4"
                >
                  {/* Top Bar: Client & Status */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-black">{drop.clientName}</h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <FiPackage className="text-orange-500" /> {drop.quantity}x {drop.apparelType} ({drop.color})
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      drop.status === "Dispatched" 
                        ? "bg-blue-100 text-blue-700 animate-pulse" 
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {drop.status === "Dispatched" ? "On the Bike" : "Ready for Pickup"}
                    </span>
                  </div>

                  {/* Address & Quick Actions for Mobile */}
                  <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 space-y-3">
                    <div className="flex items-start gap-2 text-xs font-semibold text-zinc-700">
                      <FiMapPin className="text-orange-500 shrink-0 mt-0.5" size={16} />
                      <span>{drop.deliveryAddress || "Address not provided"}</span>
                    </div>

                    {/* One-Tap Contact & Navigation Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${drop.clientPhone}`}
                        className="flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-black py-2 rounded-xl text-xs font-bold transition"
                      >
                        <FiPhone className="text-green-600" size={14} /> Call Client
                      </a>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(drop.deliveryAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-100 text-black py-2 rounded-xl text-xs font-bold transition"
                      >
                        <FiNavigation className="text-blue-600" size={14} /> Open Maps
                      </a>
                    </div>
                  </div>

                  {/* Item Specs & Notes */}
                  {drop.designNotes && (
                    <p className="text-xs text-zinc-500 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                      <strong>Note:</strong> {drop.designNotes}
                    </p>
                  )}

                  {/* Status Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                    {drop.status === "Ready for Delivery" && (
                      <button
                        onClick={() => handleStatusChange(drop.id, "Dispatched")}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <FiTruck size={14} /> Start Delivery (Out for Drop)
                      </button>
                    )}

                    {drop.status === "Dispatched" && (
                      <button
                        onClick={() => handleStatusChange(drop.id, "Delivered", true)}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle size={14} /> Mark Delivered & Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Drops Today */}
        {completedToday.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FiCheckCircle className="text-green-500" /> Completed Today ({completedToday.length})
            </h2>

            <div className="bg-white rounded-3xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
              {completedToday.map((drop) => (
                <div key={drop.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-black">{drop.clientName}</p>
                    <p className="text-zinc-400">{drop.apparelType} ({drop.quantity} pcs) • {drop.deliveryAddress}</p>
                  </div>
                  <span className="flex items-center gap-1 font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    <FiDollarSign size={12} /> Complete
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}