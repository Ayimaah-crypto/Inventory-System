import { db } from "../Firebase/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";

// Listen to items ready for delivery or completed today
export const subscribeToDeliveries = (callback) => {
  const jobsRef = collection(db, "jobCards");
  const q = query(
    jobsRef, 
    where("status", "in", ["Ready for Delivery", "Dispatched", "Delivered"])
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// Mark job as Dispatched (On the bike) or Completed
export const updateDeliveryStatus = async (jobId, status, paymentCollected = false) => {
  const jobRef = doc(db, "jobCards", jobId);
  await updateDoc(jobRef, {
    status,
    paymentCollected,
    deliveredAt: status === "Delivered" ? serverTimestamp() : null,
  });
};