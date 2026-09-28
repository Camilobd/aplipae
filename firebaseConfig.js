import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA-FvVwv5bKauHdgUOQIqkx4qK0g-psb5A",
  authDomain: "aplipae-489be.firebaseapp.com",
  projectId: "aplipae-489be",
  storageBucket: "aplipae-489be.firebasestorage.app",
  messagingSenderId: "264809000941",
  appId: "1:264809000941:web:222abee1470107cced81e4"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export async function iniciarSesionAnonima() {
  try {
    const resultado = await signInAnonymously(auth);
    console.log('Sesión anónima iniciada. UID:', resultado.user.uid);
    return resultado.user;
  } catch (error) {
    console.log('Error al iniciar sesión anónima:', error);
    throw error;
  }
}