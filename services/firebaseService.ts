import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { DUMMY_DRIVERS, DUMMY_EXPENSES, DUMMY_USERS, DUMMY_TRUCKS, DUMMY_MAINTENANCE, DUMMY_TRACKING } from '../constants';
import { emptyData, parseData, type UserData } from '../lib/data';
import { accountId, auth, db, isDemo } from './session';
import { readLocalData, writeLocalData } from '../lib/localData';
import type { User } from '../types';
export async function fetchUserData(user?: User): Promise<UserData> {
 if (isDemo) {
  return readLocalData(localStorage, { expenses: DUMMY_EXPENSES, drivers: DUMMY_DRIVERS, users: DUMMY_USERS, trucks: DUMMY_TRUCKS, maintenance: DUMMY_MAINTENANCE, trackingData: DUMMY_TRACKING, revision: 0 }, user);
 }
 if (!auth.currentUser) throw new Error('Entre novamente para consultar a base.');
 const snapshot = await getDocFromServer(doc(db, 'fleet_workspaces', accountId));
 return snapshot.exists() ? parseData({ ...snapshot.data(), users: [] }) : emptyData();
}
export async function saveUserData(input: UserData, user: User): Promise<number> {
 const data = parseData(input);
 if (isDemo) {
  return writeLocalData(localStorage, data, user);
 }
 if (!auth.currentUser) throw new Error('Entre novamente antes de salvar.');
 const reference = doc(db, 'fleet_workspaces', accountId);
 return runTransaction(db, async transaction => {
  const current = await transaction.get(reference);
  const revision = current.exists() ? current.data().revision ?? 0 : 0;
  if (revision !== data.revision) throw new Error('A base foi alterada por outro usuário. Recarregue antes de salvar para evitar sobrescrever dados.');
  const { users, ...businessData } = data;
  transaction.set(reference, JSON.parse(JSON.stringify({ ...businessData, revision: revision + 1 })));
  return revision + 1;
 });
}
