import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { createInvoice } from "../Services/invoiceService";
import { useReactToPrint } from "react-to-print";
import { FiPlus, FiTrash2, FiPrinter, FiCheckCircle, FiUploadCloud } from "react-icons/fi";
import { useSettings } from "../Context/SettingsContext";

export default function Invoices() {
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { settings } = useSettings();

  const printRef = useRef(null);

  // Real-time listener for products to populate dropdown
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Handle adding an item to the invoice
  const handleAddItem = (productId) => {
    const selectedProd = products.find((p) => p.id === productId);
    if (!selectedProd) return;

    const existingIndex = items.findIndex((i) => i.productId === productId);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: selectedProd.id,
          productName: selectedProd.productName,
          unitPrice: selectedProd.sellingPrice || 0,
          quantity: 1,
        },
      ]);
    }
  };

  const handleQuantityChange = (index, qty) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, parseInt(qty) || 1);
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const currencySymbol = settings?.currency || "GH₵";
  const taxRatePercent = Number(settings?.taxRate) || 0;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = subtotal * (taxRatePercent / 100);
  const totalBeforeDiscount = subtotal + taxAmount;
  const totalAmount = Math.max(0, totalBeforeDiscount - parseFloat(discount || 0));

  // Print function
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${customerName || "Customer"}`,
  });

  // Save invoice to Firestore
  const handleSaveInvoice = async () => {
    if (items.length === 0) return alert("Please add at least one product.");
    setLoading(true);

    try {
      await createInvoice({
        customerName: customerName || "Walk-in Customer",
        customerPhone,
        customerAddress,
        items,
        subtotal,
        taxRate: taxRatePercent,
        taxAmount,
        discount: parseFloat(discount || 0),
        totalAmount,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setItems([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        setDiscount(0);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  };

  const todayDate = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-zinc-100 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Invoice Generator</h1>
            <p className="text-zinc-500 text-sm mt-1">Create sales receipts and update stock automatically.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={items.length === 0}
              className="flex items-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-black px-4 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              <FiPrinter size={18} /> Print / Download PDF
            </button>
            <button
              onClick={handleSaveInvoice}
              disabled={loading || items.length === 0}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {success ? <FiCheckCircle size={18} /> : <FiPlus size={18} />}
              {loading ? "Saving..." : success ? "Invoice Saved!" : "Save Invoice"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column (Left Side) */}
          <div className="space-y-6">
            
            {/* Customer Details Input */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <h3 className="font-bold text-black text-base">Customer Info</h3>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ama Kwakye"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 024XXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Street Name, City"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Product Selector */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <h3 className="font-bold text-black text-base">Add Products to Invoice</h3>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Select Product</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleAddItem(e.target.value);
                    e.target.value = "";
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Choose Item --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.totalStock <= 0}>
                      {p.productName} ({currencySymbol} {p.sellingPrice}) — {p.totalStock > 0 ? `${p.totalStock} in stock` : "Out of stock"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Discounts / Adjustments */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <h3 className="font-bold text-black text-base">Adjustments</h3>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Discount Amount ({currencySymbol})</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

          </div>

          {/* Printable Invoice Design Preview (Right Side) */}
          <div className="lg:col-span-2">
            <div 
              className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-sm font-sans text-zinc-800 print:shadow-none print:border-none print:p-0" 
              ref={printRef}
            >
              
              {/* Top Bar: Store Information & Logo Header */}
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-black">
                    {settings?.storeName || "Your Company Inc."}
                  </h1>
                  <p className="text-xs text-zinc-500 whitespace-pre-line">
                    {settings?.address || "123 Store Address, City"}
                  </p>
                  {settings?.phone && (
                    <p className="text-xs text-zinc-500">{settings.phone}</p>
                  )}
                  {settings?.email && (
                    <p className="text-xs text-zinc-500">{settings.email}</p>
                  )}
                </div>

                {/* Upload Logo Place-holder Box */}
                <div className="w-52 h-20 border-2 border-dashed border-zinc-300 rounded-xl flex items-center justify-center text-zinc-400 gap-2 cursor-pointer hover:border-zinc-400 hover:text-zinc-600 transition print:hidden">
                  <FiUploadCloud size={20} />
                  <span className="text-xs font-semibold">Upload Logo</span>
                </div>
              </div>

              {/* Header Title */}
              <div className="text-right mb-8">
                <h2 className="text-4xl font-black text-black tracking-widest uppercase">
                  INVOICE
                </h2>
              </div>

              {/* Bill To & Invoice Meta Details */}
              <div className="flex justify-between items-start mb-10 text-xs">
                <div className="space-y-1 max-w-xs">
                  <span className="font-extrabold text-black uppercase tracking-wider block mb-1">
                    Bill To
                  </span>
                  <p className="text-sm font-bold text-black">
                    {customerName || "Walk-in Customer"}
                  </p>
                  {customerPhone && (
                    <p className="text-zinc-600">{customerPhone}</p>
                  )}
                  {customerAddress && (
                    <p className="text-zinc-500 whitespace-pre-line">{customerAddress}</p>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <div className="flex justify-end gap-4">
                    <span className="font-extrabold text-black uppercase">Invoice date</span>
                    <span className="font-medium text-zinc-700 w-24">{todayDate}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Items Table */}
              <table className="w-full text-left text-xs mb-6">
                <thead>
                  <tr className="border-b-2 border-black text-black uppercase font-extrabold">
                    <th className="py-2.5 w-12">QTY</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right w-28">Unit Price</th>
                    <th className="py-2.5 text-right w-28">Amount</th>
                    <th className="py-2.5 text-center w-12 print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-zinc-400 font-medium">
                        No products added to invoice yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const lineTotal = item.quantity * item.unitPrice;
                      return (
                        <tr key={index} className="text-zinc-700 font-medium">
                          <td className="py-3 font-semibold">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-10 text-center border border-zinc-200 rounded py-0.5 focus:outline-none print:border-none"
                            />
                          </td>
                          <td className="py-3">{item.productName}</td>
                          <td className="py-3 text-right">
                            {currencySymbol} {Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-semibold text-black">
                            {currencySymbol} {lineTotal.toFixed(2)}
                          </td>
                          <td className="py-3 text-center print:hidden">
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-zinc-400 hover:text-red-500 transition"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2 text-xs border-t-2 border-black pt-3">
                  <div className="flex justify-between font-semibold text-zinc-700">
                    <span>Subtotal</span>
                    <span>{currencySymbol} {subtotal.toFixed(2)}</span>
                  </div>

                  {taxRatePercent > 0 && (
                    <div className="flex justify-between font-semibold text-zinc-700">
                      <span>Sales Tax ({taxRatePercent}%)</span>
                      <span>{currencySymbol} {taxAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {parseFloat(discount) > 0 && (
                    <div className="flex justify-between font-semibold text-orange-600">
                      <span>Discount</span>
                      <span>- {currencySymbol} {parseFloat(discount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-extrabold text-sm text-black pt-2 border-t border-black">
                    <span>Total ({currencySymbol})</span>
                    <span>{currencySymbol} {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Store Footer Note */}
              <div className="space-y-1 text-xs border-t border-zinc-100 pt-6">
                <h4 className="font-extrabold text-black uppercase tracking-wider">
                  Terms and Conditions
                </h4>
                <p className="text-zinc-600 whitespace-pre-line">
                  {settings?.invoiceFooterNote ||
                    "Thank you for doing business with us!"}
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}