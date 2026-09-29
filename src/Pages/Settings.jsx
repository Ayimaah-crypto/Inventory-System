import { useState, useEffect } from "react";
import { useSettings } from "../Context/SettingsContext";
import { FiSave, FiShoppingBag, FiCheckCircle, FiDollarSign, FiFileText } from "react-icons/fi";

export default function Settings() {
  const { settings, updateSettings, loadingSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "",
    phone: "",
    email: "",
    address: "",
    currency: "GH₵",
    taxRate: 0,
    invoiceFooterNote: "",
  });

  // Keep local form in sync with global settings
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData); // Saves to Firestore and updates Context globally
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to update store settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center text-zinc-400 font-medium">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Store Settings</h1>
            <p className="text-zinc-500 text-sm mt-1">Configure company details, branding, and invoice defaults.</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm disabled:opacity-50"
          >
            {success ? <FiCheckCircle size={18} /> : <FiSave size={18} />}
            {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Business Profile */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-black text-lg pb-2 border-b border-zinc-100">
              <FiShoppingBag className="text-orange-500" /> General Business Profile
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Store / Business Name</label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Official Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Location Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Currency */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-black text-lg pb-2 border-b border-zinc-100">
              <FiDollarSign className="text-green-600" /> Currency & Tax Configuration
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency || "GH₵"}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="taxRate"
                  value={formData.taxRate || 0}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Invoice Customization */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-black text-lg pb-2 border-b border-zinc-100">
              <FiFileText className="text-blue-600" /> Invoice Defaults
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Invoice Footer Note</label>
              <textarea
                name="invoiceFooterNote"
                rows="3"
                value={formData.invoiceFooterNote || ""}
                onChange={handleChange}
                placeholder="e.g. Thank you for shopping with us! No refund after 7 days."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              ></textarea>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}