import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { addExpense, deleteExpense } from "../Services/expenseService";
import { useSettings } from "../Context/SettingsContext";
import { FiDollarSign, FiPlus, FiTrash2, FiTag, FiCalendar, FiTrendingDown } from "react-icons/fi";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState("Restock");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  const currencySymbol = settings?.currency || "GH₵";

  // Listen to expenses collection live
  useEffect(() => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return alert("Please enter a valid amount.");

    setLoading(true);
    try {
      await addExpense({
        category,
        description,
        amount: parseFloat(amount),
        date,
      });

      // Clear form inputs
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error(err);
      alert("Failed to log expense.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this expense record?")) {
      await deleteExpense(id);
    }
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-100 py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Expense Tracker</h1>
            <p className="text-zinc-500 text-sm mt-1">Record business spending and operational costs.</p>
          </div>

          <div className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-red-50 text-red-500 rounded-xl">
              <FiTrendingDown size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase">Total Outflow</p>
              <p className="text-lg font-black text-black">
                {currencySymbol} {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Expense Form (Left Column) */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-black text-base border-b border-zinc-100 pb-3">Log New Expense</h3>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="Restock">Inventory Restock</option>
                  <option value="Rent">Rent & Utility</option>
                  <option value="Logistics">Transport & Delivery</option>
                  <option value="Salaries">Staff Payroll</option>
                  <option value="Marketing">Ads & Promotion</option>
                  <option value="Miscellaneous">Other Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Description / Note</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Paid supplier for restock batch A"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold text-sm transition shadow-sm disabled:opacity-50"
              >
                <FiPlus size={18} />
                {loading ? "Recording..." : "Record Expense"}
              </button>
            </form>
          </div>

          {/* Expenses Table (Right Column) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-black text-base border-b border-zinc-100 pb-3 mb-4">Expense Records</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 font-extrabold text-black uppercase">
                    <th className="py-3">Date</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Note</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-zinc-400 font-medium">
                        No expenses logged yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item.id} className="text-zinc-700 font-medium">
                        <td className="py-3.5 whitespace-nowrap">{item.date}</td>
                        <td className="py-3.5">
                          <span className="bg-zinc-100 text-zinc-800 font-semibold px-2.5 py-1 rounded-lg">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-500">{item.description || "—"}</td>
                        <td className="py-3.5 text-right font-bold text-black">
                          {currencySymbol} {Number(item.amount).toFixed(2)}
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-zinc-400 hover:text-red-500 transition"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}