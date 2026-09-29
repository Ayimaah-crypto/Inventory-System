import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Firebase/firebase";

import Sidebar from "./Components/layout/Sidebar";
import Header from "./Components/layout/Header";
import Login from "./Pages/Login";

// Page imports
import Dashboard from "./Pages/Dashboard";
import Products from "./Pages/Products";
import AddProducts from "./Pages/AddProducts";
import JobCards from "./Pages/JobCards";
import Invoices from "./Pages/Invoices";
import Settings from "./Pages/Settings";
import Deliveries from "./Pages/Deliveries";
import Reports from "./Pages/Reports";
import Expenses from "./Pages/Expenses";
import Workspace from "./Pages/WorkSpace";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 text-sm font-semibold">
        Loading...
      </div>
    );
  }

  // If not logged in, show Login page
  if (!user) {
    return <Login />;
  }

  // Main Dashboard Layout once signed in
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/add-product" element={<AddProducts />} />
            <Route path="/job-cards" element={<JobCards />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/workspaces" element={<Workspace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}