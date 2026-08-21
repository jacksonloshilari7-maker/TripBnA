
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);