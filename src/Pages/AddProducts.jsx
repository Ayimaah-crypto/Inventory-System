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

  // Handle Image Selection and Convert to Base64 (Bypasses Firebase Storage)
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

  // Save Product to Firestore
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!productName || !sellingPrice || !costPrice) {
      alert("Please fill in required fields (Product Name, Cost, and Selling Price).");
      return;
    }

    setLoading(true);

    try {
      const productData = {
        productName,
        sku,
        brand,
        category,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        estimatedProfit: Number(sellingPrice) - Number(costPrice),
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
    <div className="min-h-screen bg-zinc-100 py-10 px-5">
      <form onSubmit={handleSaveProduct} className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-bold text-black">New Product</h1>
            <p className="text-gray-500 mt-1">Add a product to Brownside Inventory</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-black hover:bg-zinc-800 text-white px-6 py-3 rounded-2xl font-semibold shadow-md transition disabled:opacity-50"
          >
            <FiSave size={18} />
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <label className="block mb-3 text-sm font-semibold text-gray-700">
            Product Image
          </label>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-orange-300 bg-orange-50 hover:bg-orange-100 rounded-2xl p-6 transition flex flex-col items-center justify-center">
              {imageBase64 ? (
                <div className="space-y-3 text-center">
                  <img
                    src={imageBase64}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-xl object-contain"
                  />
                  <p className="text-sm text-orange-600 font-medium">{image?.name}</p>
                </div>
              ) : (
                <div>
                  <FiUploadCloud size={50} className="mx-auto text-orange-500 mb-3" />
                  <p className="text-lg font-semibold text-center">
                    Drag & Drop Product Image
                  </p>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    or click to browse files
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
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Product Information</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Brownside Premium Tee"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                SKU / Product Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="BRN-TS-001"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brownside"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="T-Shirts"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Cost Price (GH₵) *
              </label>
              <input
                type="number"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="50"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Selling Price (GH₵) *
              </label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="120"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Estimated Profit Summary */}
        <div className="bg-black rounded-3xl p-6 flex justify-between items-center">
          <div>
            <p className="text-gray-400 text-sm">Estimated Profit Per Item</p>
            <h2 className="text-4xl font-bold text-orange-400 mt-1">
              GH₵ {Number(sellingPrice || 0) - Number(costPrice || 0)}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Inventory Stock</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalStock} pcs</h3>
          </div>
        </div>

        {/* Product Variations */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Product Variations</h2>
            <button
              type="button"
              onClick={addVariation}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl transition text-sm font-semibold"
            >
              <FiPlus />
              Add Variation
            </button>
          </div>

          {variations.map((variation, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 mb-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 items-center"
            >
              <input
                type="text"
                placeholder="Color"
                value={variation.color}
                onChange={(e) => handleVariationChange(index, "color", e.target.value)}
                className="col-span-4 border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <select
                value={variation.size}
                onChange={(e) => handleVariationChange(index, "size", e.target.value)}
                className="col-span-3 border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Size</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>

              <input
                type="number"
                placeholder="Qty"
                value={variation.stock}
                onChange={(e) => handleVariationChange(index, "stock", e.target.value)}
                className="col-span-4 border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <div className="col-span-1 flex items-center justify-center">
                {variations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariation(index)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <FiTrash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}