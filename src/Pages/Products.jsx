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
  FiPlus,
  FiMinusCircle,
  FiX,
  FiFilter,
  FiEdit,
  FiEye,
  FiCheck,
  FiUpload,
  FiPlusCircle
} from "react-icons/fi";
import { Link } from "react-router-dom";

// Helper function to render CSS-compatible background color for common color names
const getColorStyle = (colorName) => {
  if (!colorName) return "bg-gray-300";
  const name = colorName.toLowerCase().trim();
  
  const map = {
    black: "bg-black",
    white: "bg-white border border-zinc-300",
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-400",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    pink: "bg-pink-400",
    gray: "bg-gray-400",
    grey: "bg-gray-400",
    brown: "bg-amber-800",
    navy: "bg-blue-900",
    beige: "bg-amber-100 border border-zinc-300",
  };

  return map[name] || "bg-zinc-400";
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedColor, setSelectedColor] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");

  // Deduct Modal State
  const [deductModal, setDeductModal] = useState({ open: false, product: null, amount: 1 });
  const [adjusting, setAdjusting] = useState(false);

  // Detail View Modal State
  const [viewProduct, setViewProduct] = useState(null);

  // Comprehensive Edit Modal State
  const [editModal, setEditModal] = useState({ open: false, product: null });
  const [editForm, setEditForm] = useState({
    productName: "",
    category: "",
    sku: "",
    costPrice: 0,
    sellingPrice: 0,
    description: "",
    imageUrl: "",
    variations: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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

  // Delete product
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

  // Stock Deduction Logic
  const openDeductModal = (product) => {
    setDeductModal({ open: true, product, amount: 1 });
  };

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

  // Open Edit Modal & Populate Form
  const openEditModal = (product) => {
    setEditForm({
      productName: product.productName || "",
      category: product.category || "",
      sku: product.sku || "",
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      variations: product.variations && product.variations.length > 0 
        ? product.variations.map(v => ({ ...v }))
        : [{ color: "", size: "", stock: 0 }],
    });
    setEditModal({ open: true, product });
  };

  // Image Upload Handler (Cloudinary Unsigned Preset)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    // Replace 'inventory_app' with your Cloudinary upload preset if different
    formData.append("upload_preset", "inventory_app"); 

    try {
      // Replace 'your_cloud_name' with your Cloudinary Cloud Name
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (data.secure_url) {
        setEditForm((prev) => ({ ...prev, imageUrl: data.secure_url }));
      } else {
        alert("Failed to upload image. You can also paste an image URL manually.");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Error uploading image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Variation Form Helpers
  const handleVariationChange = (index, field, value) => {
    const updated = [...editForm.variations];
    updated[index][field] = field === "stock" ? Number(value) : value;
    setEditForm({ ...editForm, variations: updated });
  };

  const addVariationRow = () => {
    setEditForm({
      ...editForm,
      variations: [...editForm.variations, { color: "", size: "", stock: 0 }],
    });
  };

  const removeVariationRow = (index) => {
    if (editForm.variations.length === 1) {
      return alert("At least one variation row is required.");
    }
    const updated = editForm.variations.filter((_, i) => i !== index);
    setEditForm({ ...editForm, variations: updated });
  };

  // Save Product Updates
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editModal.product) return;

    // Calculate updated total stock based on variations
    const computedTotalStock = editForm.variations.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0
    );

    setSavingEdit(true);
    try {
      const productRef = doc(db, "products", editModal.product.id);
      const updatedFields = {
        productName: editForm.productName,
        category: editForm.category,
        sku: editForm.sku,
        costPrice: Number(editForm.costPrice),
        sellingPrice: Number(editForm.sellingPrice),
        description: editForm.description,
        imageUrl: editForm.imageUrl,
        variations: editForm.variations,
        totalStock: computedTotalStock,
        estimatedProfit: Number(editForm.sellingPrice) - Number(editForm.costPrice),
      };

      await updateDoc(productRef, updatedFields);
      setEditModal({ open: false, product: null });
      if (viewProduct?.id === editModal.product.id) {
        setViewProduct({ ...viewProduct, ...updatedFields });
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product details.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter Categories, Colors, and Sizes dynamically
  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];
  
  const allColors = [
    "All",
    ...new Set(
      products
        .flatMap((p) => p.variations || [])
        .map((v) => v.color)
        .filter(Boolean)
    ),
  ];

  const allSizes = [
    "All",
    ...new Set(
      products
        .flatMap((p) => p.variations || [])
        .map((v) => v.size)
        .filter(Boolean)
    ),
  ];

  // Multi-Filter Logic
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    
    const matchesSearch =
      product.productName?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term);

    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    const matchesColor =
      selectedColor === "All" ||
      product.variations?.some(
        (v) => v.color?.toLowerCase() === selectedColor.toLowerCase()
      );

    const matchesSize =
      selectedSize === "All" ||
      product.variations?.some(
        (v) => v.size?.toLowerCase() === selectedSize.toLowerCase()
      );

    return matchesSearch && matchesCategory && matchesColor && matchesSize;
  });

  const totalItems = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-black">Inventory Stock</h1>
            <p className="text-gray-500 text-sm mt-1">
              Filter, edit images, colors, sizes, and track stock levels.
            </p>
          </div>

          <Link
            to="/add-product"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-semibold transition shadow-md text-sm"
          >
            <FiPlus size={18} />
            Add New Product
          </Link>
        </div>

        {/* Quick Stock Bar */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Quantity Available</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-black mt-1">{totalItems} pcs in stock</h3>
          </div>
          <div className="bg-orange-100 p-3.5 rounded-2xl text-orange-600">
            <FiPackage size={26} />
          </div>
        </div>

        {/* Multi-Filter Bar */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-200 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 border-b border-zinc-100 pb-3">
            <FiFilter className="text-orange-500" size={16} /> Filter Inventory
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm bg-zinc-50/50"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-zinc-50/50 text-zinc-700"
              >
                <option value="All">All Categories / Clothes</option>
                {categories.filter(c => c !== "All").map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-zinc-50/50 text-zinc-700"
              >
                <option value="All">All Colors</option>
                {allColors.filter(c => c !== "All").map((color, i) => (
                  <option key={i} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-zinc-50/50 text-zinc-700"
              >
                <option value="All">All Sizes</option>
                {allSizes.filter(s => s !== "All").map((size, i) => (
                  <option key={i} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Products Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-medium text-sm">
              Loading inventory stock...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium text-sm">
              No stock items found matching selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Product Info</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Colors & Sizes (Breakdown)</th>
                    <th className="p-4">Total Quantity</th>
                    <th className="p-4 text-zinc-400">Price (GHS)</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition">
                      
                      {/* Product Image & Info */}
                      <td className="p-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => setViewProduct(p)}
                            className="relative group cursor-pointer shrink-0"
                          >
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.productName}
                                className="w-14 h-14 object-cover rounded-2xl border border-zinc-200 shadow-xs group-hover:opacity-80 transition"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold text-base group-hover:opacity-80 transition">
                                {p.productName?.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                              <FiEye size={18} />
                            </div>
                          </div>
                          <div>
                            <p 
                              onClick={() => setViewProduct(p)}
                              className="font-bold text-zinc-900 leading-tight cursor-pointer hover:text-orange-600 transition"
                            >
                              {p.productName}
                            </p>
                            <span className="inline-block bg-zinc-100 text-zinc-600 text-[11px] px-2 py-0.5 rounded-md mt-1 font-medium">
                              {p.category || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="p-4 font-mono text-xs text-zinc-600 font-semibold">
                        {p.sku || "N/A"}
                      </td>

                      {/* Variations Breakdown */}
                      <td className="p-4">
                        {p.variations && p.variations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {p.variations.map((v, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200/80 px-2.5 py-1 rounded-xl text-xs"
                              >
                                <span
                                  className={`w-3 h-3 rounded-full shrink-0 shadow-xs ${getColorStyle(
                                    v.color
                                  )}`}
                                />
                                <span className="font-semibold text-zinc-800">
                                  {v.color || "Default"}
                                </span>
                                <span className="text-zinc-400">|</span>
                                <span className="font-medium text-zinc-600">{v.size || "Free"}</span>
                                <span className="text-zinc-400">|</span>
                                <span className="font-bold text-orange-600">{v.stock} pcs</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">No variations</span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1.5 rounded-2xl text-xs font-bold ${
                            p.totalStock > 10
                              ? "bg-green-100 text-green-700"
                              : p.totalStock > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {p.totalStock || 0} pcs left
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="p-4 text-zinc-500 text-xs whitespace-nowrap">
                        <span className="font-medium text-zinc-800">GH₵ {p.sellingPrice || 0}</span>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-xl text-zinc-600 hover:text-black hover:bg-zinc-100 transition"
                            title="Edit Product Details, Variations & Image"
                          >
                            <FiEdit size={16} />
                          </button>

                          <button
                            onClick={() => openDeductModal(p)}
                            className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-xl transition"
                            title="Deduct Stock"
                          >
                            <FiMinusCircle size={14} /> Deduct
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.productName)}
                            className="text-zinc-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition"
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

      {/* Detail Preview Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-100 relative max-h-[90vh] flex flex-col">
            
            <button
              onClick={() => setViewProduct(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
            >
              <FiX size={18} />
            </button>

            <div className="w-full h-64 bg-zinc-100 relative shrink-0">
              {viewProduct.imageUrl ? (
                <img
                  src={viewProduct.imageUrl}
                  alt={viewProduct.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-extrabold text-3xl">
                  {viewProduct.productName?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-black">{viewProduct.productName}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">SKU: <span className="font-mono text-zinc-800">{viewProduct.sku || "N/A"}</span></p>
                </div>
                <span className="bg-orange-100 text-orange-700 font-semibold text-xs px-3 py-1 rounded-full">
                  {viewProduct.category || "General"}
                </span>
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                  {viewProduct.description || "No description provided for this product."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Available Variations</p>
                {viewProduct.variations && viewProduct.variations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {viewProduct.variations.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60 text-xs">
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${getColorStyle(v.color)}`} />
                        <div className="truncate">
                          <p className="font-bold text-zinc-800">{v.color || "N/A"} ({v.size || "Free"})</p>
                          <p className="text-orange-600 font-semibold">{v.stock} pcs available</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No variation details found.</p>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    const p = viewProduct;
                    setViewProduct(null);
                    openEditModal(p);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white py-3 rounded-2xl font-semibold text-xs transition"
                >
                  <FiEdit size={16} /> Edit Product, Image & Variations
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Comprehensive Edit Product Modal (Image + Colors/Sizes + Info) */}
      {editModal.open && editModal.product && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-zinc-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModal({ open: false, product: null })}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1"
            >
              <FiX size={20} />
            </button>

            <div>
              <h3 className="text-xl font-bold text-black">Edit Product Details</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Update images, colors, sizes, and info for <span className="font-semibold text-black">{editModal.product.productName}</span>.
              </p>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              
              {/* Product Image Upload / Edit */}
              <div className="space-y-2">
                <label className="block font-semibold text-zinc-700">Product Image</label>
                <div className="flex items-center gap-4">
                  {editForm.imageUrl ? (
                    <img
                      src={editForm.imageUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-2xl border border-zinc-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs font-semibold">
                      No Image
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/60 px-3 py-2 rounded-xl cursor-pointer w-fit transition">
                      <FiUpload size={14} />
                      {uploadingImage ? "Uploading Image..." : "Upload New Picture"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste image URL directly..."
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div>
                <label className="block font-semibold text-zinc-600 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-600 mb-1">Category / Clothe</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-600 mb-1">SKU</label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-600 mb-1">Cost Price (GH₵)</label>
                  <input
                    type="number"
                    value={editForm.costPrice}
                    onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-600 mb-1">Selling Price (GH₵)</label>
                  <input
                    type="number"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Dynamic Variations Section: Colors, Sizes, Quantities */}
              <div className="space-y-2 border-t border-b border-zinc-100 py-3">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-zinc-800">Product Variations (Colors & Sizes)</label>
                  <button
                    type="button"
                    onClick={addVariationRow}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    <FiPlusCircle size={14} /> Add Variation
                  </button>
                </div>

                <div className="space-y-2">
                  {editForm.variations.map((varItem, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-zinc-50 p-2 rounded-2xl border border-zinc-200/70">
                      <input
                        type="text"
                        placeholder="Color (e.g. Blue)"
                        value={varItem.color}
                        onChange={(e) => handleVariationChange(idx, "color", e.target.value)}
                        className="w-1/3 px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="text"
                        placeholder="Size (e.g. L, XL)"
                        value={varItem.size}
                        onChange={(e) => handleVariationChange(idx, "size", e.target.value)}
                        className="w-1/3 px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="number"
                        placeholder="Stock Qty"
                        value={varItem.stock}
                        onChange={(e) => handleVariationChange(idx, "stock", e.target.value)}
                        className="w-1/4 px-2.5 py-1.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariationRow(idx)}
                        className="text-zinc-400 hover:text-red-500 p-1"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-zinc-600 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter details about material, style, etc..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, product: null })}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || uploadingImage}
                  className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  <FiCheck size={14} /> {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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