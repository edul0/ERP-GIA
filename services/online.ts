import type { User } from '../types';
const base = (import.meta.env.VITE_GIA_API_URL || 'https://ghnhunsbdgbcchycxjsn.supabase.co/functions/v1/gia-api').replace(/\/$/, '');
const key = 'gia_online_session';
export const getWorkspaceOwner = () => sessionStorage.getItem('gia_workspace_owner') || '';
export const setWorkspaceOwner = (owner: string) => sessionStorage.setItem('gia_workspace_owner', owner);
export const onlineEnabled = import.meta.env.VITE_DATA_MODE !== 'demo';
export async function onlineRequest<T>(action: string, options: RequestInit = {}): Promise<T> {
 let response: Response;
 try {
  response = await fetch(`${base}/${action}${['data','upload','file'].includes(action) ? '?owner='+encodeURIComponent(getWorkspaceOwner()) : ''}`, { ...options, signal: options.signal || AbortSignal.timeout(30000), headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${sessionStorage.getItem(key) || ''}`, ...options.headers } });
 } catch { throw new Error('Sem conexão com o banco online. As alterações continuam neste preenchimento.'); }
 const data = await response.json();
 if (!response.ok) throw new Error(data.error || 'Não foi possível conectar ao banco online.');
 return data;
}
export async function onlineLogin(username: string, password: string): Promise<User> {
 const result = await onlineRequest<{token: string; user: User}>('login', { method: 'POST', body: JSON.stringify({ username, password }) });
 sessionStorage.setItem(key, result.token); sessionStorage.removeItem('gia_workspace_owner'); return result.user;
}
export async function onlineProfile(): Promise<User | null> {
 if (!sessionStorage.getItem(key)) return null;
 return onlineRequest<User>('profile');
}
export async function onlineLogout() {
 try { await onlineRequest('logout', { method: 'POST' }); } finally { sessionStorage.removeItem(key); }
}
