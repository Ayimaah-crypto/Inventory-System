import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { 
  FiGrid, 
  FiPackage, 
  FiPlusCircle, 
  FiFileText, 
  FiLayers, 
  FiSettings,
  FiTruck,
  FiDollarSign
} from "react-icons/fi";

// Import named exports from Firebase config
import { db } from "../../Firebase/firebase";


export default function Sidebar() {
  const location = useLocation();

  // State and Effect MUST be inside the component body
  const [businessName, setBusinessName] = useState("Brownside");

  useEffect(() => {
    // Listen to business settings document
    const unsub = onSnapshot(doc(db, "settings", "businessInfo"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().storeName) {
        setBusinessName(docSnap.data().storeName);
      }
    });
    return () => unsub();
  }, []);

  const navItems = [
    { name: "Dashboard", path: "/", icon: FiGrid },
    { name: "Products", path: "/products", icon: FiPackage },
    { name: "Add Product", path: "/add-product", icon: FiPlusCircle },
    { name: "Job Cards", path: "/job-cards", icon: FiLayers },
    { name: "Invoices", path: "/invoices", icon: FiFileText },
    { name: "Expenses", path: "/expenses", icon: FiDollarSign },
    { name: "Reports", path: "/reports", icon: FiDollarSign},
     { name: "Deliveries", path: "/deliveries", icon: FiTruck },
     { name: "Workspaces", path: "/workspaces", icon: FiLayers },
    { name: "Settings", path: "/settings", icon: FiSettings },  
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 min-h-screen flex flex-col justify-between p-4">
      <div className="space-y-6">
        
        {/* Brand Header */}
        <div className="px-3 py-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-lg">
            {businessName.charAt(0)}
          </div>
          <div>
            <h2 className="font-extrabold text-black text-base tracking-tight leading-none">
              {businessName}
            </h2>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Custom Apparel
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

      </div>

      {/* Footer info / Version badge */}
      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-400 font-medium text-center">
        v1.0.0 • Production Ready
      </div>
    </aside>
  );
}