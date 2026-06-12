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
  apiKey: "AIzaSyDNcz4b8pO17erLeIJsbhxc2ekchPkmha8",
  authDomain: "proyecto-pri-81fd5.firebaseapp.com",
  projectId: "proyecto-pri-81fd5",
  storageBucket: "proyecto-pri-81fd5.firebasestorage.app",
  messagingSenderId: "876748063075",
  appId: "1:876748063075:web:6e075f73a385bb804e5356",
  measurementId: "G-BMD6293HG8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);