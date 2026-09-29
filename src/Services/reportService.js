import { db } from "../Firebase/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

// Fetch sales invoices within a specific date range
export const getSalesReportByDate = async (startDate, endDate) => {
  const invoicesRef = collection(db, "invoices");
  
  // Set start of day and end of day
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const q = query(
    invoicesRef,
    where("createdAt", ">=", start),
    where("createdAt", "<=", end),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()?.toLocaleDateString() || "N/A",
  }));
};