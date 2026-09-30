import { emptyData, parseData, type UserData } from './data';
import type { User } from '../types';

export const DEMO_KEY = 'frota_demo_data_v2';
export const workspaceKey = (user: User) => user.role === 'admin' ? DEMO_KEY : `frota_workspace_v1_${encodeURIComponent(user.id)}`;
type Store = Pick<Storage, 'getItem' | 'setItem'>;

export function readLocalData(store: Store, seed: UserData, user?: User): UserData {
  const adminSaved = store.getItem(DEMO_KEY);
  const admin = adminSaved ? parseData(JSON.parse(adminSaved)) : parseData(seed);
  if (!user || user.role === 'admin') return admin;
  const saved = store.getItem(workspaceKey(user));
  if (saved) return parseData({ ...JSON.parse(saved), users: [] });
  return { ...emptyData(), trucks: structuredClone(admin.trucks) };
}

export function writeLocalData(store: Store, input: UserData, user: User): number {
  if (user.role === 'viewer') throw new Error('Seu perfil permite apenas consulta.');
  const data = parseData(input);
  const key = workspaceKey(user);
  const saved = store.getItem(key);
  const revision = saved ? parseData(JSON.parse(saved)).revision : 0;
  if (revision !== data.revision) throw new Error('Outra aba salvou alterações. Recarregue a base antes de salvar.');
  store.setItem(key, JSON.stringify({ ...data, users: user.role === 'admin' ? data.users : [], revision: revision + 1 }));
  return revision + 1;
}
