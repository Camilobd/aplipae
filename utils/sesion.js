import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// El aforador entra con una sesión anónima: la app la crea si el dispositivo no tiene ninguna.
export async function asegurarSesion() {
  if (auth.currentUser) return auth.currentUser;
  const resultado = await signInAnonymously(auth);
  return resultado.user;
}