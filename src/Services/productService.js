import { db } from "../Firebase/firebase";
import { 
  collection, 
  doc, 
  deleteDoc, 
  updateDoc, 
  increment 
} from "firebase/firestore";

const productsRef = collection(db, "products");

// 1. Delete a product completely
export const deleteProduct = async (productId) => {
  const productDoc = doc(db, "products", productId);
  await deleteDoc(productDoc);
};

// 2. Reduce stock by a specific amount (e.g. damaged or written-off items)
export const adjustProductStock = async (productId, amountToDeduct) => {
  const productDoc = doc(db, "products", productId);
  await updateDoc(productDoc, {
    totalStock: increment(-Math.abs(amountToDeduct)),
  });
};