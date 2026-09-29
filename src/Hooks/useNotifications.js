import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebase";

export function useNotifications() {
  const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);
  const [todayRemindersCount, setTodayRemindersCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Listen for today's reminders
    const qReminders = query(collection(db, "reminders"), where("date", "==", todayStr));
    const unsubReminders = onSnapshot(qReminders, (snapshot) => {
      const count = snapshot.docs.length;
      setTodayRemindersCount(count);
    });

    // 2. Listen for unpaid/outstanding invoices
    const qInvoices = query(collection(db, "invoices"), where("status", "==", "Unpaid"));
    const unsubInvoices = onSnapshot(qInvoices, (snapshot) => {
      const count = snapshot.docs.length;
      setUnpaidInvoicesCount(count);
    });

    // 3. Listen for out-of-stock or low-stock products
    const qProducts = collection(db, "products");
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const lowStockList = snapshot.docs
        .map((d) => d.data())
        .filter((p) => (Number(p.totalStock) || 0) <= 2);
      setOutOfStockCount(lowStockList.length);
    });

    return () => {
      unsubReminders();
      unsubInvoices();
      unsubProducts();
    };
  }, []);

  const totalAlertsCount = todayRemindersCount + unpaidInvoicesCount + outOfStockCount;

  return {
    todayRemindersCount,
    unpaidInvoicesCount,
    outOfStockCount,
    totalAlertsCount,
  };
}