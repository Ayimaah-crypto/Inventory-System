import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import {
  FiPlus,
  FiTrash2,
  FiCheck,
  FiCalendar,
  FiEdit3,
  FiGrid,
  FiBookOpen,
  FiClock,
} from "react-icons/fi";

// Date Localizer Setup for Big Calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const NOTE_COLORS = [
  { name: "Yellow", bg: "bg-amber-100 border-amber-200 text-amber-900" },
  { name: "Blue", bg: "bg-sky-100 border-sky-200 text-sky-900" },
  { name: "Pink", bg: "bg-rose-100 border-rose-200 text-rose-900" },
  { name: "Green", bg: "bg-emerald-100 border-emerald-200 text-emerald-900" },
  { name: "Purple", bg: "bg-purple-100 border-purple-200 text-purple-900" },
];

export default function Workspace() {
  const [activeTab, setActiveTab] = useState("sticky"); // "sticky" | "calendar" | "notes"

  // ---------------------------------------------------------------------------
  // 1. STICKY NOTES STATE & LOGIC
  // ---------------------------------------------------------------------------
  const [stickyNotes, setStickyNotes] = useState([]);
  const [stickyText, setStickyText] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].bg);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "stickyNotes"), (snapshot) => {
      setStickyNotes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddSticky = async (e) => {
    e.preventDefault();
    if (!stickyText.trim()) return;

    await addDoc(collection(db, "stickyNotes"), {
      text: stickyText,
      color: selectedColor,
      isCompleted: false,
      createdAt: serverTimestamp(),
    });
    setStickyText("");
  };

  const toggleStickyComplete = async (id, currentStatus) => {
    await updateDoc(doc(db, "stickyNotes", id), { isCompleted: !currentStatus });
  };

  const handleDeleteSticky = async (id) => {
    await deleteDoc(doc(db, "stickyNotes", id));
  };

  // ---------------------------------------------------------------------------
  // 2. CALENDAR & REMINDERS STATE & LOGIC
  // ---------------------------------------------------------------------------
  const [reminders, setReminders] = useState([]);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderType, setReminderType] = useState("Restock");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reminders"), (snapshot) => {
      setReminders(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: `${data.type ? `[${data.type}] ` : ""}${data.title}`,
            start: new Date(data.date),
            end: new Date(data.date),
            rawDate: data.date,
            type: data.type,
          };
        })
      );
    });
    return () => unsub();
  }, []);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return alert("Please fill in title and date.");

    await addDoc(collection(db, "reminders"), {
      title: reminderTitle,
      date: reminderDate,
      type: reminderType,
      createdAt: serverTimestamp(),
    });

    setReminderTitle("");
    setReminderDate("");
  };

  const handleDeleteReminder = async (id) => {
    await deleteDoc(doc(db, "reminders", id));
  };

  // ---------------------------------------------------------------------------
  // 3. PRIVATE NOTES STATE & LOGIC
  // ---------------------------------------------------------------------------
  const [personalNotes, setPersonalNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState("General");
  const [noteContent, setNoteContent] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "personalNotes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setPersonalNotes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSavePersonalNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return alert("Please add a title and content.");

    await addDoc(collection(db, "personalNotes"), {
      title: noteTitle,
      category: noteCategory,
      content: noteContent,
      createdAt: serverTimestamp(),
    });

    setNoteTitle("");
    setNoteContent("");
  };

  const handleDeletePersonalNote = async (id) => {
    await deleteDoc(doc(db, "personalNotes", id));
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Workspace Hub</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage tasks, schedules, sticky notes, and store documentation.</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm text-xs font-bold">
            <button
              onClick={() => setActiveTab("sticky")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                activeTab === "sticky" ? "bg-black text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              <FiGrid size={15} /> Sticky Board
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                activeTab === "calendar" ? "bg-black text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              <FiCalendar size={15} /> Calendar & Reminders
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                activeTab === "notes" ? "bg-black text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              <FiBookOpen size={15} /> Private Notes
            </button>
          </div>
        </div>

        {/* TAB 1: STICKY BOARD */}
        {activeTab === "sticky" && (
          <div className="space-y-6">
            {/* Create Note Form */}
            <form onSubmit={handleAddSticky} className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                placeholder="Write a quick note, quote, or task..."
                value={stickyText}
                onChange={(e) => setStickyText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              
              <div className="flex items-center gap-1.5 shrink-0">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.bg)}
                    className={`w-6 h-6 rounded-full ${c.bg.split(" ")[0]} border-2 ${
                      selectedColor === c.bg ? "border-black scale-110" : "border-transparent"
                    } transition`}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1 shrink-0 transition"
              >
                <FiPlus size={18} /> Add
              </button>
            </form>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stickyNotes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-zinc-400 font-medium">
                  No sticky notes on the board yet. Add one above!
                </div>
              ) : (
                stickyNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-5 rounded-3xl border ${note.color} flex flex-col justify-between min-h-[160px] shadow-sm relative transition hover:shadow-md`}
                  >
                    <p className={`text-sm font-medium leading-relaxed ${note.isCompleted ? "line-through opacity-50" : ""}`}>
                      {note.text}
                    </p>

                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        onClick={() => toggleStickyComplete(note.id, note.isCompleted)}
                        className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-zinc-800 transition"
                      >
                        <FiCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSticky(note.id)}
                        className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-red-600 transition"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CALENDAR & REMINDERS */}
        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Sidebar: Add Event + List */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
                <h3 className="font-bold text-black text-base border-b border-zinc-100 pb-3">Set Reminder</h3>
                
                <form onSubmit={handleAddReminder} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Restock inventory"
                      value={reminderTitle}
                      onChange={(e) => setReminderTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Type</label>
                    <select
                      value={reminderType}
                      onChange={(e) => setReminderType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      <option value="Restock">Restock Alert</option>
                      <option value="Payment">Payment Due</option>
                      <option value="Client">Client Meeting</option>
                      <option value="General">General Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition"
                  >
                    <FiPlus size={18} /> Schedule Reminder
                  </button>
                </form>
              </div>

              {/* Reminders List */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-3">
                <h3 className="font-bold text-black text-base border-b border-zinc-100 pb-3">Upcoming Schedules</h3>
                
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {reminders.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">No scheduled events.</p>
                  ) : (
                    reminders.map((r) => (
                      <div key={r.id} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <div>
                          <p className="text-xs font-bold text-black">{r.title}</p>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <FiClock size={10} /> {r.rawDate}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteReminder(r.id)} className="text-zinc-400 hover:text-red-500 transition">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Big Calendar */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm h-[600px]">
              <Calendar
                localizer={localizer}
                events={reminders}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                views={["month", "agenda"]}
              />
            </div>

          </div>
        )}

        {/* TAB 3: PRIVATE NOTES WORKSPACE */}
        {activeTab === "notes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* New Note Form */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4 h-fit">
              <h3 className="font-bold text-black text-base border-b border-zinc-100 pb-3">Create Document</h3>
              
              <form onSubmit={handleSavePersonalNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Supplier Agreements 2026"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Category</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="General">General Documentation</option>
                    <option value="Suppliers">Supplier Contact Info</option>
                    <option value="Strategy">Store Strategy & Ideas</option>
                    <option value="Personal">Personal Record</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Note Content</label>
                  <textarea
                    rows="6"
                    placeholder="Write details, agreement terms, or private notes here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-1 transition shadow-sm"
                >
                  <FiPlus size={18} /> Save Private Note
                </button>
              </form>
            </div>

            {/* Saved Notes Display Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalNotes.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-3xl border border-zinc-200 text-center text-zinc-400 font-medium">
                    No private notes saved yet.
                  </div>
                ) : (
                  personalNotes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNote(n)}
                      className={`bg-white p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                        selectedNote?.id === n.id ? "border-orange-500 ring-2 ring-orange-100" : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-zinc-100 text-zinc-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase">
                            {n.category}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePersonalNote(n.id);
                            }}
                            className="text-zinc-400 hover:text-red-500 transition"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                        <h4 className="font-bold text-black text-sm mb-1">{n.title}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-3">{n.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Full Note Preview Box */}
              {selectedNote && (
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-orange-600">
                        {selectedNote.category}
                      </span>
                      <h3 className="text-lg font-bold text-black">{selectedNote.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedNote(null)}
                      className="text-xs text-zinc-400 hover:text-black font-semibold"
                    >
                      Close Preview
                    </button>
                  </div>
                  <p className="text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNote.content}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}