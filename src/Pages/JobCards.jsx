import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { createJobCard, updateJobStatus, deleteJobCard } from "../Services/jobCardService";
import { 
  FiPlus, 
  FiLayers, 
  FiPrinter, 
  FiTruck, 
  FiCheckCircle, 
  FiTrash2, 
  FiX, 
  FiPhone, 
  FiMapPin 
} from "react-icons/fi";

export default function JobCards() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    deliveryAddress: "",
    apparelType: "Plain T-Shirt",
    color: "Black",
    sizeBreakdown: "S: 0, M: 2, L: 3, XL: 1",
    quantity: 6,
    printType: "DTF Print", // DTF, Screen Print, Embroidery, Vinyl
    designNotes: "",
    dueDate: "",
  });

  // Listen to Job Cards in real time
  useEffect(() => {
    const q = query(collection(db, "jobCards"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setJobs(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createJobCard(formData);
      setShowModal(false);
      setFormData({
        clientName: "",
        clientPhone: "",
        deliveryAddress: "",
        apparelType: "Plain T-Shirt",
        color: "Black",
        sizeBreakdown: "",
        quantity: 1,
        printType: "DTF Print",
        designNotes: "",
        dueDate: "",
      });
    } catch (err) {
      console.error("Failed to create job card:", err);
      alert("Error saving job card.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (jobId, status) => {
    try {
      await updateJobStatus(jobId, status);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (jobId, client) => {
    if (window.confirm(`Delete custom job for ${client}?`)) {
      await deleteJobCard(jobId);
    }
  };

  // Grouping jobs by status
  const pendingJobs = jobs.filter((j) => j.status === "Pending Sourcing");
  const productionJobs = jobs.filter((j) => j.status === "In Production");
  const readyJobs = jobs.filter((j) => j.status === "Ready for Delivery");

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Custom Job Cards</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Track plain garment sourcing, customization specs, and delivery pipeline.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm transition shadow-sm"
          >
            <FiPlus size={18} /> New Custom Job
          </button>
        </div>

        {/* Pipeline Summary Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">1. Needs Sourcing</p>
              <h3 className="text-2xl font-extrabold text-black mt-1">{pendingJobs.length} Orders</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FiLayers size={22} /></div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">2. In Printing / Customization</p>
              <h3 className="text-2xl font-extrabold text-black mt-1">{productionJobs.length} Orders</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FiPrinter size={22} /></div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase">3. Ready for Motorbike Delivery</p>
              <h3 className="text-2xl font-extrabold text-black mt-1">{readyJobs.length} Drops</h3>
            </div>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><FiTruck size={22} /></div>
          </div>
        </div>

        {/* Job Cards List */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-black border-b border-zinc-100 pb-3">Active Custom Jobs</h2>

          {loading ? (
            <div className="text-center py-10 text-zinc-400">Loading production queue...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">No active job cards found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition ${
                    job.status === "Ready for Delivery" 
                      ? "border-orange-300 bg-orange-50/30" 
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Status & Date */}
                    <div className="flex justify-between items-center text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        job.status === "Pending Sourcing" ? "bg-amber-100 text-amber-700" :
                        job.status === "In Production" ? "bg-blue-100 text-blue-700" :
                        job.status === "Ready for Delivery" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {job.status}
                      </span>
                      {job.dueDate && <span className="text-zinc-400 font-medium">Due: {job.dueDate}</span>}
                    </div>

                    {/* Client Details */}
                    <div>
                      <h3 className="font-bold text-black text-base">{job.clientName}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1"><FiPhone size={12} /> {job.clientPhone}</span>
                        <span className="flex items-center gap-1"><FiMapPin size={12} /> {job.deliveryAddress}</span>
                      </div>
                    </div>

                    {/* Specs Box */}
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs space-y-1.5">
                      <div className="flex justify-between font-semibold text-black">
                        <span>{job.apparelType} ({job.color})</span>
                        <span className="text-orange-600">{job.quantity} pcs</span>
                      </div>
                      <p className="text-zinc-500"><strong>Sizes:</strong> {job.sizeBreakdown || "Standard"}</p>
                      <p className="text-zinc-500"><strong>Print:</strong> {job.printType}</p>
                      {job.designNotes && (
                        <p className="text-zinc-600 italic bg-white p-2 rounded-lg border border-zinc-200 mt-1">
                          "{job.designNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Workflow Transition Buttons */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job.id, e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Pending Sourcing">Pending Sourcing</option>
                      <option value="In Production">In Production</option>
                      <option value="Ready for Delivery">Ready for Delivery</option>
                      <option value="Delivered">Delivered & Complete</option>
                    </select>

                    <button
                      onClick={() => handleDelete(job.id, job.clientName)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                      title="Delete Job"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* New Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black p-1"
            >
              <FiX size={20} />
            </button>

            <h3 className="text-xl font-bold text-black">New Custom Order Job Card</h3>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Delivery Address / Drop Zone</label>
                <input
                  type="text"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  placeholder="e.g. East Legon, near Shell"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Garment Type</label>
                  <input
                    type="text"
                    name="apparelType"
                    value={formData.apparelType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Total Pieces</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Size Breakdown</label>
                  <input
                    type="text"
                    name="sizeBreakdown"
                    value={formData.sizeBreakdown}
                    onChange={handleInputChange}
                    placeholder="e.g. S:2, M:5, L:3"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Print Technique</label>
                  <select
                    name="printType"
                    value={formData.printType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="DTF Print">DTF Print</option>
                    <option value="Screen Print">Screen Print</option>
                    <option value="Embroidery">Embroidery</option>
                    <option value="Vinyl Flex">Vinyl Flex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Design / Print Specs & Placement</label>
                <textarea
                  name="designNotes"
                  rows="3"
                  value={formData.designNotes}
                  onChange={handleInputChange}
                  placeholder="e.g. Front left chest logo + big centered back print."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Save Job Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}