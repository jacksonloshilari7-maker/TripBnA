import { db, auth, storage, app } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
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
  increment,
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
window.sendPasswordResetEmail = sendPasswordResetEmail;

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
window.increment = increment;
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

// Helper to upload a file with multipart server storage and resilient fallback
window.uploadFileToStorage = async function(path, file) {
  if (!file) return null;
  if (typeof file === 'string' && (file.startsWith('http') || file.startsWith('/') || file.startsWith('data:'))) return file;
  if (file._uploadedUrl && !file._uploadedUrl.startsWith('blob:')) return file._uploadedUrl;

  // Pre-compress image client-side to minimize upload payload and latency
  let toUpload = file;
  if (typeof window.compressImageFile === 'function' && file instanceof Blob && file.type && file.type.startsWith('image/')) {
    try {
      toUpload = await window.compressImageFile(file, 1600, 0.82);
    } catch(e) {}
  }

  // 1. Try high-speed server multipart upload first
  try {
    const fd = new FormData();
    fd.append('file', toUpload, toUpload.name || (toUpload.type?.startsWith('video') ? 'video.mp4' : 'photo.jpg'));
    const resp = await fetch('/api/upload-file', { method: 'POST', body: fd });
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.success && data.url) {
        file._uploadedUrl = data.url;
        if (data.type === 'video' && window.triplineVideoUrls) window.triplineVideoUrls.add(data.url);
        return data.url;
      }
    }
  } catch (srvErr) {
    console.warn("Multipart server upload notice:", srvErr.message);
  }

  // 2. Reliable permanent compressed base64 fallback (never expires like transient blob URLs)
  try {
    const base64Url = await new Promise((res) => {
      const r = new FileReader();
      r.onload = ev => res(ev.target.result);
      r.onerror = () => res(null);
      r.readAsDataURL(toUpload);
    });
    if (base64Url) {
      file._uploadedUrl = base64Url;
      return base64Url;
    }
  } catch(e) {}

  return null;
};

window.isFirebaseReady = true;
window.dispatchEvent(new CustomEvent("firebase-ready", { detail: { auth, db, storage } }));

console.log("TripBnA Firebase SDK fully initialized!");
