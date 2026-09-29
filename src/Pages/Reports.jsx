import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { getSalesReportByDate } from "../Services/reportService";
import { 
  FiBarChart2, 
  FiDownload, 
  FiCalendar, 
  FiDollarSign, 
  FiPackage, 
  FiFilter
} from "react-icons/fi";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load Sales Report
  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const data = await getSalesReportByDate(startDate, endDate);
      setSalesData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load sales report.");
    } finally {
      setLoading(false);
    }
  };

  // Load Inventory Report
  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInventoryData(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sales") {
      fetchSalesReport();
    } else {
      fetchInventoryReport();
    }
  }, [activeTab]);

  // Pure Browser CSV Export (No Node 'stream' dependency required)
  const handleExportCSV = () => {
    let rows = [];

    if (activeTab === "sales") {
      if (salesData.length === 0) return alert("No sales data to export.");
      
      // Header row
      rows.push(["Invoice ID", "Customer Name", "Phone", "Total Amount (GHS)", "Date"]);

      // Data rows
      salesData.forEach((item) => {
        rows.push([
          `"${item.id || ""}"`,
          `"${item.customerName || "Walk-in Customer"}"`,
          `"${item.customerPhone || ""}"`,
          item.totalAmount || 0,
          `"${item.createdAt || ""}"`
        ]);
      });
    } else {
      if (inventoryData.length === 0) return alert("No inventory data to export.");

      // Header row
      rows.push(["Product Name", "Category", "SKU", "Cost Price", "Selling Price", "Current Stock"]);

      // Data rows
      inventoryData.forEach((item) => {
        rows.push([
          `"${item.productName || ""}"`,
          `"${item.category || "General"}"`,
          `"${item.sku || ""}"`,
          item.costPrice || 0,
          item.sellingPrice || 0,
          item.totalStock || 0
        ]);
      });
    }

    // Convert array rows to CSV text
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics Summary
  const totalRevenue = salesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalItemsSold = salesData.reduce(
    (sum, item) => sum + (item.items?.reduce((s, i) => s + i.quantity, 0) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-zinc-100 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Reports & Analytics</h1>
            <p className="text-zinc-500 text-sm mt-1">Export transaction histories and audit inventory status.</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm"
          >
            <FiDownload size={18} /> Export as CSV
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 max-w-md">
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${
              activeTab === "sales" ? "bg-orange-500 text-white shadow-sm" : "text-zinc-500 hover:text-black"
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${
              activeTab === "inventory" ? "bg-orange-500 text-white shadow-sm" : "text-zinc-500 hover:text-black"
            }`}
          >
            Inventory Valuation
          </button>
        </div>

        {/* Filter Controls (Sales Tab Only) */}
        {activeTab === "sales" && (
          <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              onClick={fetchSalesReport}
              className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              <FiFilter size={14} /> Apply Filter
            </button>
          </div>
        )}

        {/* Sales Summary Metrics */}
        {activeTab === "sales" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Period Revenue</p>
                <h3 className="text-3xl font-extrabold text-black mt-1">GH₵ {totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                <FiDollarSign size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Invoices Created</p>
                <h3 className="text-3xl font-extrabold text-black mt-1">{salesData.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <FiBarChart2 size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Units Sold</p>
                <h3 className="text-3xl font-extrabold text-orange-500 mt-1">{totalItemsSold} pcs</h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                <FiPackage size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-zinc-400 font-medium text-sm">
              Generating report data...
            </div>
          ) : activeTab === "sales" ? (
            salesData.length === 0 ? (
              <div className="p-10 text-center text-zinc-400 font-medium text-sm">
                No invoices found in this date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Items Quantity</th>
                      <th className="p-4">Total Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {salesData.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50/50 transition">
                        <td className="p-4 font-semibold text-black">{inv.customerName || "Walk-in Customer"}</td>
                        <td className="p-4 text-zinc-500">{inv.createdAt}</td>
                        <td className="p-4 text-zinc-700">
                          {inv.items?.reduce((sum, item) => sum + item.quantity, 0)} items
                        </td>
                        <td className="p-4 font-bold text-black">GH₵ {inv.totalAmount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Cost Price</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Current Stock</th>
                    <th className="p-4">Stock Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {inventoryData.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition">
                      <td className="p-4 font-semibold text-black">{p.productName}</td>
                      <td className="p-4 text-zinc-500">{p.category || "General"}</td>
                      <td className="p-4 text-zinc-600">GH₵ {p.costPrice || 0}</td>
                      <td className="p-4 text-black font-medium">GH₵ {p.sellingPrice || 0}</td>
                      <td className="p-4 font-bold">{p.totalStock || 0}</td>
                      <td className="p-4 font-bold text-orange-500">
                        GH₵ {((p.sellingPrice || 0) * (p.totalStock || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}