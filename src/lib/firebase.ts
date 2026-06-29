import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";

// Read Firebase configurations
const firebaseConfig = {
  projectId: "fit-citizen-lgxqk",
  appId: "1:504705557740:web:432d8e8c55e9e15303b1c9",
  apiKey: "AIzaSyC0Xh4VnTEkdi0TWF4ryiy8pMvF5MoRPi0",
  authDomain: "fit-citizen-lgxqk.firebaseapp.com",
  storageBucket: "fit-citizen-lgxqk.firebasestorage.app",
  messagingSenderId: "504705557740"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/documents");
googleProvider.addScope("https://www.googleapis.com/auth/drive.file");

// In-memory token cache
let cachedAccessToken: string | null = null;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};
export const getCachedAccessToken = () => cachedAccessToken;

export { 
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  doc, 
  query, 
  orderBy 
};
export type { User };
