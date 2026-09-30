import { useState } from "react";
import { FiUploadCloud, FiTrash2, FiPlus, FiSave } from "react-icons/fi";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../Firebase/firebase"; // Adjust path to match your firebase config file

export default function AddProducts() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("Brownside");
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState([
    { color: "", size: "", stock: "" },
  ]);

  // Handle Image Selection and Convert to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVariationChange = (index, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[index][field] = value;
    setVariations(updatedVariations);
  };

  const addVariation = () => {
    setVariations([...variations, { color: "", size: "", stock: "" }]);
  };

  const removeVariation = (index) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  // Calculate Total Stock from all variations
  const totalStock = variations.reduce(
    (sum, v) => sum + (Number(v.stock) || 0),
    0
  );

  // Helper numeric conversions
  const parsedCostPrice = Number(costPrice) || 0;
  const parsedSellingPrice = Number(sellingPrice) || 0;
  const estimatedProfit = parsedSellingPrice - parsedCostPrice;

  // Save Product to Firestore
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!productName.trim()) {
      alert("Please fill in the Product Name.");
      return;
    }

    setLoading(true);

    try {
      const productData = {
        productName,
        sku,
        brand,
        category,
        costPrice: parsedCostPrice,
        sellingPrice: parsedSellingPrice,
        estimatedProfit,
        totalStock,
        variations: variations.map((v) => ({
          ...v,
          stock: Number(v.stock) || 0,
        })),
        imageUrl: imageBase64 || null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "products"), productData);

      alert("Product saved successfully!");

      // Reset Form
      setProductName("");
      setCategory("");
      setCostPrice("");
      setSellingPrice("");
      setSku("");
      setImage(null);
      setImageBase64("");
      setVariations([{ color: "", size: "", stock: "" }]);
    } catch (error) {
      console.error("Error saving product: ", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-6 sm:py-10 px-4 sm:px-6">
      <form onSubmit={handleSaveProduct} className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-black">New Product</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Add a product to Brownside Inventory
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-6 py-3 rounded-2xl font-semibold shadow-md transition disabled:opacity-50 text-sm"
          >
            <FiSave size={18} />
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>

        {/* Upload Image Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-zinc-200/80 p-5 sm:p-8">
          <label className="block mb-3 text-xs sm:text-sm font-semibold text-gray-700">
            Product Image
          </label>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-100/50 rounded-2xl p-6 transition flex flex-col items-center justify-center">
              {imageBase64 ? (
                <div className="space-y-3 text-center">
                  <img
                    src={imageBase64}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-xl object-contain shadow-xs"
                  />
                  <p className="text-xs text-orange-600 font-medium truncate max-w-xs mx-auto">
                    {image?.name}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <FiUploadCloud size={42} className="mx-auto text-orange-500 mb-2" />
                  <p className="text-base sm:text-lg font-semibold text-zinc-800">
                    Drag & Drop Product Image
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    or click to browse files from device
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>

        {/* Product Information */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-zinc-200/80 p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-black mb-5">Product Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block mb-1.5 text-xs sm:text-sm text-gray-700 font-semibold">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Brownside Premium Tee"
                className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs sm:text-sm text-gray-700 font-semibold">
                SKU / Product Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BRN-TS-001"
                className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs sm:text-sm text-gray-700 font-semibold">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brownside"
                className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs sm:text-sm text-gray-700 font-semibold">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="T-Shirts"
                className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs sm:text-sm text-gray-700 font-semibold">
                Cost Price (GH₵) <span className="text-[10px] text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="50"
                className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs sm:text-sm text-gray-700 font-semibold">
                Selling Price (GH₵) <span className="text-[10px] text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="120"
                className="w-full border border-gray-300 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Estimated Profit Summary Card */}
        <div className="bg-black rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-row justify-between items-center text-white">
          <div>
            <p className="text-gray-400 text-xs sm:text-sm font-medium">Estimated Profit / Item</p>
            <h2 className="text-2xl sm:text-4xl font-black text-orange-400 mt-0.5">
              GH₵ {estimatedProfit.toFixed(2)}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs sm:text-sm font-medium">Total Inventory</p>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalStock} pcs</h3>
          </div>
        </div>

        {/* Product Variations */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-zinc-200/80 p-5 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black">Product Variations</h2>
            <button
              type="button"
              onClick={addVariation}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl transition text-xs font-bold"
            >
              <FiPlus size={16} />
              Add Variation
            </button>
          </div>

          <div className="space-y-3">
            {variations.map((variation, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3.5 sm:p-4 bg-zinc-50 rounded-2xl border border-zinc-200 items-center relative"
              >
                <div className="sm:col-span-5">
                  <label className="block sm:hidden text-[11px] text-zinc-500 font-semibold mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="Color (e.g. Black)"
                    value={variation.color}
                    onChange={(e) => handleVariationChange(index, "color", e.target.value)}
                    className="w-full border border-zinc-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:contents gap-2">
                  <div className="sm:col-span-3">
                    <label className="block sm:hidden text-[11px] text-zinc-500 font-semibold mb-1">
                      Size
                    </label>
                    <select
                      value={variation.size}
                      onChange={(e) => handleVariationChange(index, "size", e.target.value)}
                      className="w-full border border-zinc-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      <option value="">Size</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block sm:hidden text-[11px] text-zinc-500 font-semibold mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={variation.stock}
                      onChange={(e) => handleVariationChange(index, "stock", e.target.value)}
                      className="w-full border border-zinc-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-1 flex items-center justify-end sm:justify-center pt-2 sm:pt-0">
                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariation(index)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Remove variation"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </form>
    </div>
  );
}