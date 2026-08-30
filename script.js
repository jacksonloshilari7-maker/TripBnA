import { db, auth, storage, app } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  limit
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

// Expose Firebase services to window
window.firebaseApp = app;
window.db = db;
window.auth = auth;
window.storage = storage;

// Auth API
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;
window.updateProfile = updateProfile;

// Firestore API
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;
window.getDoc = getDoc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.doc = doc;
window.serverTimestamp = serverTimestamp;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.onSnapshot = onSnapshot;
window.arrayUnion = arrayUnion;
window.arrayRemove = arrayRemove;
window.limit = limit;

// Storage API
window.storageRef = ref;
window.uploadBytes = uploadBytes;
window.getDownloadURL = getDownloadURL;

// Helper to convert and compress image/media to lightweight Data URL
window.fileToDataUrl = function(file, maxDimension = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } else {
      // Video or other file type
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    }
  });
};

// Helper to upload a file to Firebase Storage with timeout & Data URL fallback
window.uploadFileToStorage = async function(path, file) {
  if (!file) return null;
  
  // Fast DataURL conversion first so we never lose media
  const fallbackDataUrl = await window.fileToDataUrl(file);

  try {
    const storageLocation = ref(storage, path);
    
    // Attempt upload with a strict 3-second timeout so user never waits too long
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageLocation, file);
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Storage upload timed out")), 3000)
    );

    const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    return downloadUrl || fallbackDataUrl;
  } catch (err) {
    console.warn("Storage upload failed/timed out, using fast encoded media:", err.message);
    return fallbackDataUrl;
  }
};

window.isFirebaseReady = true;
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: { auth, db, storage } }));

console.log("TripBnA Firebase SDK fully initialized!");
