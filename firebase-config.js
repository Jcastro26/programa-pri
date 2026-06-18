// =======================================================
// CONEXIÓN OFICIAL EN LA NUBE - ECOISTEMA PROGRAMA-PRI
// =======================================================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABVpETOiTxYNoEKE-sLXjQHgPkkCgAZ30",
  authDomain: "programa-pri-2d395.firebaseapp.com",
  projectId: "programa-pri-2d395",
  storageBucket: "programa-pri-2d395.firebasestorage.app",
  messagingSenderId: "854011964095",
  appId: "1:854011964095:web:6e075f73a385bb804e5356",
  measurementId: "G-BMD6293HG8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);