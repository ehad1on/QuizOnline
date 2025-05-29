import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7WClHNwMHrtygXs3qhxwuBHcDHa56UU0",
  authDomain: "onlinequiz-se.firebaseapp.com",
  projectId: "onlinequiz-se",
  storageBucket: "onlinequiz-se.firebasestorage.app",
  messagingSenderId: "917962854862",
  appId: "1:917962854862:web:664713d541cf3c2b3b1b9f"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
