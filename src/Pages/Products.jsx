import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { 
  FiSearch, 
  FiTrash2, 
  FiPackage, 
  FiDollarSign, 
  FiTrendingUp, 
  FiPlus,
  FiMinusCircle,
  FiX
} from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State for Deducting Stock
  const [deductModal, setDeductModal] = useState({ open: false, product: null, amount: 1 });
  const [adjusting, setAdjusting] = useState(false);

  // Real-time listener for Firestore 'products' collection
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Delete product completely
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        console.error("Error deleting product: ", error);
        alert("Failed to delete product.");
      }
    }
  };

  // Open modal for deducting stock
  const openDeductModal = (product) => {
    setDeductModal({ open: true, product, amount: 1 });
  };

  // Submit stock deduction to Firestore
  const handleDeductStock = async (e) => {
    e.preventDefault();
    const { product, amount } = deductModal;
    const qty = parseInt(amount, 10);

    if (!qty || qty <= 0) return alert("Please enter a valid quantity.");
    if (qty > (product.totalStock || 0)) {
      return alert("Deduction quantity cannot exceed current total stock.");
    }

    setAdjusting(true);
    try {
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, {
        totalStock: increment(-qty),
      });
      setDeductModal({ open: false, product: null, amount: 1 });
    } catch (err) {
      console.error("Error reducing stock:", err);
      alert("Failed to adjust stock quantity.");
    } finally {
      setAdjusting(false);
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate high-level summary metrics
  const totalItems = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);
  const totalValue = products.reduce(
    (sum, p) => sum + (p.sellingPrice || 0) * (p.totalStock || 0),
    0
  );
  const totalPotentialProfit = products.reduce(
    (sum, p) => sum + (p.estimatedProfit || 0) * (p.totalStock || 0),
    0
  );

  // Extract unique categories for filter dropdown
  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-zinc-100 py-10 px-5">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-black">Inventory Products</h1>
            <p className="text-gray-500 mt-1">
              Manage stock, update stock levels, view product variations, and track valuation.
            </p>
          </div>

          <Link
            to="/add-product"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-semibold transition shadow-md"
          >
            <FiPlus size={20} />
            Add New Product
          </Link>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Stock Quantity</p>
              <h3 className="text-3xl font-bold text-black mt-1">{totalItems} pcs</h3>
            </div>
            <div className="bg-orange-100 p-4 rounded-2xl text-orange-600">
              <FiPackage size={28} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Stock Valuation</p>
              <h3 className="text-3xl font-bold text-black mt-1">
                GH₵ {totalValue.toLocaleString()}
              </h3>
            </div>
            <div className="bg-green-100 p-4 rounded-2xl text-green-600">
              <FiDollarSign size={28} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Potential Profit</p>
              <h3 className="text-3xl font-bold text-orange-500 mt-1">
                GH₵ {totalPotentialProfit.toLocaleString()}
              </h3>
            </div>
            <div className="bg-black p-4 rounded-2xl text-orange-400">
              <FiTrendingUp size={28} />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-zinc-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-gray-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {categories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-3xl shadow-lg border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500 font-medium">
              Loading inventory products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center text-gray-500 font-medium">
              No products found in inventory.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">SKU / Brand</th>
                    <th className="p-4">Cost Price</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Profit/Unit</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 transition">
                      
                      {/* Name & Image */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.productName}
                              className="w-12 h-12 object-cover rounded-xl border border-zinc-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 font-bold">
                              {p.productName?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-black">{p.productName}</p>
                            <span className="inline-block bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-md mt-1">
                              {p.category || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Brand */}
                      <td className="p-4 text-gray-600">
                        <p className="font-mono text-xs text-gray-800">{p.sku || "-"}</p>
                        <p className="text-xs text-gray-400">{p.brand || "Brownside"}</p>
                      </td>

                      {/* Pricing */}
                      <td className="p-4 font-medium text-gray-700">GH₵ {p.costPrice}</td>
                      <td className="p-4 font-bold text-black">GH₵ {p.sellingPrice}</td>
                      <td className="p-4 font-semibold text-orange-500">
                        +GH₵ {p.estimatedProfit}
                      </td>

                      {/* Total Stock & Variation Summary */}
                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            p.totalStock > 10
                              ? "bg-green-100 text-green-700"
                              : p.totalStock > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.totalStock || 0} in stock
                        </span>
                        
                        {/* Variations list tag preview */}
                        {p.variations && p.variations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.variations.map((v, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-gray-600"
                              >
                                {v.color} / {v.size} ({v.stock})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions: Deduct & Delete */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDeductModal(p)}
                            className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition"
                            title="Deduct stock (damage, expired, or write-off)"
                          >
                            <FiMinusCircle size={14} /> Deduct
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.productName)}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition"
                            title="Delete Product"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Deduct Stock Modal */}
      {deductModal.open && deductModal.product && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-100 relative">
            <button
              onClick={() => setDeductModal({ open: false, product: null, amount: 1 })}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1"
            >
              <FiX size={20} />
            </button>

            <div>
              <h3 className="text-xl font-bold text-black">Deduct Stock Quantity</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Reduce stock for <span className="font-semibold text-black">{deductModal.product.productName}</span> due to damages, write-offs, or losses.
              </p>
            </div>

            <form onSubmit={handleDeductStock} className="space-y-4">
              <div className="bg-zinc-50 p-3 rounded-2xl text-xs space-y-1">
                <p className="text-zinc-500">Current Stock: <strong className="text-black">{deductModal.product.totalStock || 0} pcs</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  Quantity to Deduct
                </label>
                <input
                  type="number"
                  min="1"
                  max={deductModal.product.totalStock || 1}
                  value={deductModal.amount}
                  onChange={(e) =>
                    setDeductModal({ ...deductModal, amount: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeductModal({ open: false, product: null, amount: 1 })}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {adjusting ? "Updating..." : "Confirm Deduction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}