import { useState, useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { Link } from "react-router-dom";
import { 
  FiPackage, 
  FiLayers, 
  FiTruck, 
  FiFileText, 
  FiPlus, 
  FiArrowRight,
  FiDollarSign 
} from "react-icons/fi";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Products
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(list);
    });

    // 2. Fetch Job Cards
    const unsubJobs = onSnapshot(collection(db, "jobCards"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setJobCards(list);
    });

    // 3. Fetch Invoices (if available)
    const unsubInvoices = onSnapshot(collection(db, "invoices"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInvoices(list);
      setLoading(false);
    }, () => setLoading(false));

    return () => {
      unsubProducts();
      unsubJobs();
      unsubInvoices();
    };
  }, []);

  // Compute stats dynamically
  const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || Number(p.quantity) || 0), 0);
  const totalValuation = products.reduce((acc, p) => {
    const qty = Number(p.stock) || Number(p.quantity) || 0;
    const price = Number(p.sellingPrice) || Number(p.price) || 0;
    return acc + (qty * price);
  }, 0);

  const pendingSourcing = jobCards.filter((j) => j.status === "Pending Sourcing").length;
  const inProduction = jobCards.filter((j) => j.status === "In Production").length;
  const readyDeliveries = jobCards.filter((j) => j.status === "Ready for Delivery" || j.status === "Dispatched").length;

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Overview Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Real-time status of plain stock, production, and deliveries.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/job-cards"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm"
            >
              <FiPlus size={18} /> New Job Card
            </Link>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Plain Stock Quantity</p>
              <h3 className="text-2xl font-extrabold text-black mt-1">{totalStock} pcs</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <FiPackage size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">In Production</p>
              <h3 className="text-2xl font-extrabold text-black mt-1">{inProduction} Jobs</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FiLayers size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Motorbike Drops</p>
              <h3 className="text-2xl font-extrabold text-black mt-1">{readyDeliveries} Pending</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <FiTruck size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Stock Valuation</p>
              <h3 className="text-2xl font-extrabold text-orange-600 mt-1">
                GH₵ {totalValuation.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-zinc-100 text-zinc-700 rounded-2xl">
              <FiDollarSign size={22} />
            </div>
          </div>

        </div>

        {/* Active Production & Delivery Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Job Cards */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="font-bold text-black text-lg flex items-center gap-2">
                <FiLayers className="text-orange-500" /> Recent Job Cards
              </h2>
              <Link to="/job-cards" className="text-xs font-semibold text-orange-500 hover:underline flex items-center gap-1">
                View All <FiArrowRight size={14} />
              </Link>
            </div>

            {jobCards.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">No active job cards created yet.</p>
            ) : (
              <div className="space-y-3">
                {jobCards.slice(0, 4).map((job) => (
                  <div key={job.id} className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-black">{job.clientName}</p>
                      <p className="text-zinc-500">{job.quantity}x {job.apparelType} ({job.printType})</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold ${
                      job.status === "Pending Sourcing" ? "bg-amber-100 text-amber-700" :
                      job.status === "In Production" ? "bg-blue-100 text-blue-700" :
                      job.status === "Ready for Delivery" ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="font-bold text-black text-lg flex items-center gap-2">
                <FiPackage className="text-orange-500" /> Stock Status
              </h2>
              <Link to="/products" className="text-xs font-semibold text-orange-500 hover:underline flex items-center gap-1">
                Manage Inventory <FiArrowRight size={14} />
              </Link>
            </div>

            {products.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">No products found in inventory.</p>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 4).map((product) => {
                  const stock = Number(product.stock) || Number(product.quantity) || 0;
                  return (
                    <div key={product.id} className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-black">{product.name || product.title}</p>
                        <p className="text-zinc-500">Price: GH₵ {product.sellingPrice || product.price}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        stock < 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {stock} in stock
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}