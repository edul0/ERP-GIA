import { DUMMY_DRIVERS, DUMMY_EXPENSES, DUMMY_USERS, DUMMY_TRUCKS, DUMMY_MAINTENANCE, DUMMY_TRACKING } from '../constants';
import { parseData, type UserData } from '../lib/data';
import { isDemo } from './session';
import { readLocalData, writeLocalData } from '../lib/localData';
import { onlineRequest } from './online';
import type { User } from '../types';
export async function fetchUserData(user?: User): Promise<UserData> {
 if (isDemo) return readLocalData(localStorage, { expenses: DUMMY_EXPENSES, drivers: DUMMY_DRIVERS, users: DUMMY_USERS, trucks: DUMMY_TRUCKS, maintenance: DUMMY_MAINTENANCE, trackingData: DUMMY_TRACKING, revision: 0 }, user);
 return parseData(await onlineRequest('data'));
}
export async function saveUserData(input: UserData, user: User): Promise<number> {
 const data = parseData(input);
 if (isDemo) return writeLocalData(localStorage, data, user);
 const result = await onlineRequest<{revision:number}>('data', {method:'PUT',body:JSON.stringify({...data,users:[]})});
 return result.revision;
}
