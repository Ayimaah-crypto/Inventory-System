import { db } from "../Firebase/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

const invoicesRef = collection(db, "invoices");

// Create invoice and automatically deduct sold stock from inventory
export const createInvoice = async (invoiceData) => {
  const docRef = await addDoc(invoicesRef, {
    ...invoiceData,
    createdAt: serverTimestamp(),
  });

  // Deduct stock for each purchased item
  for (const item of invoiceData.items) {
    if (item.productId) {
      const productRef = doc(db, "products", item.productId);
      await updateDoc(productRef, {
        totalStock: increment(-item.quantity),
      });
    }
  }

  return docRef;
};

// Fetch all invoices
export const getInvoices = async () => {
  const snapshot = await getDocs(invoicesRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};