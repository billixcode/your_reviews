// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfvFo67UbV1j_TWLJp2eq98-7JWBmUKNs",
  authDomain: "your-reviews-app-1755877051.firebaseapp.com",
  projectId: "your-reviews-app-1755877051",
  storageBucket: "your-reviews-app-1755877051.firebasestorage.app",
  messagingSenderId: "618063827581",
  appId: "1:618063827581:web:afdb9b9c55bd53d7f15714"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
