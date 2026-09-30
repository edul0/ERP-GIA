import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import { roleSchema } from '../lib/data';
import type { User } from '../types';
// Keep the existing username/password experience. The shared Firebase base is
// available when the deployment explicitly sets VITE_DATA_MODE=cloud.
export const isDemo = import.meta.env.VITE_DATA_MODE !== 'cloud';
const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const accountId = import.meta.env.VITE_ACCOUNT_ID || 'frotapro_main';
export async function cloudProfile(): Promise<User | null> {
 await auth.authStateReady();
 if (!auth.currentUser) return null;
 const snapshot = await getDoc(doc(db, 'erp_members', auth.currentUser.uid));
 const profile = snapshot.data();
 const role = roleSchema.safeParse(profile?.role);
 if (!snapshot.exists() || profile?.accountId !== accountId || !role.success) throw new Error('Sua conta ainda não tem acesso a esta empresa. Solicite o cadastro ao administrador.');
 return { id: auth.currentUser.uid, username: auth.currentUser.email || 'Usuário', role: role.data };
}
export async function loginCloud(email: string, password: string): Promise<User> {
 try { await signInWithEmailAndPassword(auth, email.trim(), password); return await cloudProfile(); }
 catch { await signOut(auth); throw new Error('Não foi possível entrar. Confira o usuário, a senha e a liberação de acesso à empresa.'); }
}
export async function logout() { sessionStorage.removeItem('frota_demo_session'); if (!isDemo) await signOut(auth); }
export async function resetPassword(email: string) {
 if (isDemo) throw new Error('Recuperação indisponível na demonstração. Use os acessos de teste informados.');
 await sendPasswordResetEmail(auth, email.trim());
}
