// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMRNaAdpZ4qpu_wKgG2UBBGDb5Qj8wScg",
  authDomain: "react-native-exam-2371c.firebaseapp.com",
  projectId: "react-native-exam-2371c",
  storageBucket: "react-native-exam-2371c.appspot.com",
  messagingSenderId: "944514179618",
  appId: "1:944514179618:web:86fb1dd73ce586d84aa07b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);


export { app, db, storage }