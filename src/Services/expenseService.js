import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../Firebase/firebase";

const EXPENSES_COLLECTION = "expenses";

// Add a new expense record
export const addExpense = async (expenseData) => {
  try {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
      ...expenseData,
      amount: parseFloat(expenseData.amount) || 0,
      createdAt: serverTimestamp(),
      date: expenseData.date || new Date().toISOString().split("T")[0],
    });
    return { id: docRef.id, ...expenseData };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

// Fetch all expenses sorted by date
export const getExpenses = async () => {
  try {
    const q = query(collection(db, EXPENSES_COLLECTION), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

// Delete an expense record
export const deleteExpense = async (id) => {
  try {
    await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};