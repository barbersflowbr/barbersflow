import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  initializeFirestore
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Credentials from firebase-applet-config.json
const firebaseConfig = {
  projectId: "funky-oarlock-wgxqk",
  appId: "1:337089985839:web:309357fd97cb0c152bb5da",
  apiKey: "AIzaSyA9i3cdfPaU52x9VOEo04Dyes_5sERtKUs",
  authDomain: "funky-oarlock-wgxqk.firebaseapp.com",
  storageBucket: "funky-oarlock-wgxqk.firebasestorage.app",
  messagingSenderId: "337089985839"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
const db = getFirestore(app, "ai-studio-barbersflow-d19ad1a7-4fdc-4f35-82a8-8683cca9fea3");

// Initialize Auth
const auth = getAuth(app);

export { db, auth };
export { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc 
};
