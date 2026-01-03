// ===============================
// IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ===============================
// CONFIG
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyABcOe4tsNjieYYEo3HwoUNxSqMhwvGJK0",
  authDomain: "taller-origen.firebaseapp.com",
  projectId: "taller-origen",
  storageBucket: "taller-origen.firebasestorage.app",
  messagingSenderId: "563693867578",
  appId: "1:563693867578:web:141c4c1afa09eeebfc5b03"
};

// ===============================
// INIT
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// EXPONER AL WINDOW
// ===============================
window.auth = auth;
window.db = db;

// Auth
window.onAuthStateChanged = onAuthStateChanged;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signOut = signOut;

// Firestore
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;

console.log("🔥 Firebase listo");
