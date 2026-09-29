import { db } from "../Firebase/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";

const jobsRef = collection(db, "jobCards");

// Create a new Custom Job Card
export const createJobCard = async (jobData) => {
  return await addDoc(jobsRef, {
    ...jobData,
    status: jobData.status || "Pending Sourcing", // Options: Pending Sourcing, In Production, Ready for Delivery, Delivered
    createdAt: serverTimestamp(),
  });
};

// Update Job Status (e.g. move to 'Ready for Delivery')
export const updateJobStatus = async (jobId, newStatus) => {
  const jobDoc = doc(db, "jobCards", jobId);
  await updateDoc(jobDoc, { status: newStatus });
};

// Delete a Job Card
export const deleteJobCard = async (jobId) => {
  const jobDoc = doc(db, "jobCards", jobId);
  await deleteDoc(jobDoc);
};