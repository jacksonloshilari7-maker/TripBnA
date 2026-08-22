// Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

// Firestore
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Authentication
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// Firebase Storage
import {
  getStorage
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

// Analytics
import {
  getAnalytics
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";


const firebaseConfig = {
  apiKey: "AIzaSyCYWxOQwFtDxVl2LNF-Af0smUL5JG4xa6E",
  authDomain: "tripbna.firebaseapp.com",
  projectId: "tripbna",
  storageBucket: "tripbna.firebasestorage.app",
  messagingSenderId: "844182654397",
 appId: "1:844182654397:web:5bb5f5e6228945261e16d4",
  measurementId: "G-1743X97LGE"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Firebase services
const db = getFirestore(app);

const auth = getAuth(app);

const storage = getStorage(app);


// Analytics
const analytics = getAnalytics(app);


// Export services so other files can use them
export {
  app,
  db,
  auth,
  storage,
  analytics
};