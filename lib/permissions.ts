export function canManageMaintenance(user:{role:string;username:string}):boolean {
 return ['admin','mechanic'].includes(user.role)||['marcio','dena'].includes(user.username.toLowerCase());
}
