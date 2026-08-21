import { db, auth, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

window.db = db;
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.doc = doc;
window.serverTimestamp = serverTimestamp;

console.log("TripBnA Firebase connected!");
console.log("Auth:", auth);
console.log("Firestore:", db);
console.log("Storage:", storage);