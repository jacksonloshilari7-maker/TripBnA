import { db, auth, storage } from "./firebase.js";

console.log("TripBnA Firebase connected!");
console.log("Auth:", auth);
console.log("Firestore:", db);
console.log("Storage:", storage);