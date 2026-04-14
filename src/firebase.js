import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCe-HnPL7D9Gyp4pSJCmBpTUrN-ONnJFuM",
  authDomain: "bait-de724.firebaseapp.com",
  projectId: "bait-de724",
  storageBucket: "bait-de724.firebasestorage.app",
  messagingSenderId: "267603014914",
  appId: "1:267603014914:web:9b15d3da3f593c1c847e1b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
