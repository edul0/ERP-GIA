import type { User } from '../types';
import { onlineEnabled, onlineLogin, onlineLogout, onlineProfile } from './online';
export const isDemo = !onlineEnabled;
export const accountId = 'gia';
export async function cloudProfile(): Promise<User | null> { return onlineProfile(); }
export async function loginCloud(username: string, password: string): Promise<User> { return onlineLogin(username.trim(), password); }
export async function logout() { sessionStorage.removeItem('frota_demo_session'); if (!isDemo) await onlineLogout(); }
export async function resetPassword(_username: string) { throw new Error('Solicite ao administrador a redefinição da sua senha.'); }
