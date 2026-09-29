import { db } from "../Firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SETTINGS_DOC_ID = "store_config";

// Fetch Store Settings
export const getStoreSettings = async () => {
  const docRef = doc(db, "settings", SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // Default fallback values
    return {
      storeName: "Brownside Retail",
      phone: "0240000000",
      email: "info@brownside.com",
      address: "Accra, Ghana",
      currency: "GH₵",
      taxRate: 0,
      invoiceFooterNote: "Thank you for shopping with Brownside!",
    };
  }
};

// Save / Update Store Settings
export const updateStoreSettings = async (settingsData) => {
  const docRef = doc(db, "settings", SETTINGS_DOC_ID);
  await setDoc(docRef, settingsData, { merge: true });
};