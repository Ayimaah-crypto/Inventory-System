import { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    companyName: "Brownside Custom Apparel",
    invoiceFooter: "Thank you for doing business with Brownside Apparel!",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);

  // Listen for real-time setting updates from Firestore
  useEffect(() => {
    const settingsRef = doc(db, "settings", "company_info");
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to save updated settings to Firestore
  const updateSettings = async (newSettings) => {
    const settingsRef = doc(db, "settings", "company_info");
    await setDoc(settingsRef, newSettings, { merge: true });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);