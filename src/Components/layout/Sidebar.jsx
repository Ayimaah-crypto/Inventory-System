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
  FiDollarSign,
  FiPieChart,
  FiMenu,
  FiX
} from "react-icons/fi";

// Import named exports from Firebase config
import { db } from "../../Firebase/firebase";

export default function Sidebar() {
  const location = useLocation();
  const [businessName, setBusinessName] = useState("Brownside");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Listen to business settings document
    const unsub = onSnapshot(doc(db, "settings", "businessInfo"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().storeName) {
        setBusinessName(docSnap.data().storeName);
      }
    });
    return () => unsub();
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { name: "Dashboard", path: "/", icon: FiGrid },
    { name: "Products", path: "/products", icon: FiPackage },
    { name: "Add Product", path: "/add-product", icon: FiPlusCircle },
    { name: "Job Cards", path: "/job-cards", icon: FiLayers },
    { name: "Invoices", path: "/invoices", icon: FiFileText },
    { name: "Expenses", path: "/expenses", icon: FiDollarSign },
    { name: "Reports", path: "/reports", icon: FiPieChart },
    { name: "Deliveries", path: "/deliveries", icon: FiTruck },
    { name: "Workspaces", path: "/workspaces", icon: FiLayers },
    { name: "Settings", path: "/settings", icon: FiSettings },   
  ];

  return (
    <>
      {/* Mobile Top Header - Stays at top of page, scrolls off screen when scrolling down */}
      <header className="lg:hidden bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-base shadow-xs">
            {businessName.charAt(0)}
          </div>
          <span className="font-extrabold text-black text-base tracking-tight">
            {businessName}
          </span>
        </div>

        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition focus:outline-none"
        >
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar - Fixed to screen on desktop (`lg:fixed lg:h-screen`) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-zinc-200 p-4 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-lg shadow-xs">
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

            {/* Mobile close button inside drawer */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-black rounded-lg hover:bg-zinc-100"
            >
              <FiX size={18} />
            </button>
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
                      ? "bg-orange-500 text-white shadow-xs"
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
        <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-400 font-medium text-center mt-8">
          v1.0.0 • Production Ready
        </div>
      </aside>
    </>
  );
}