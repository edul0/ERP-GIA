import type {ReactNode} from 'react';
export default function EmptyState({icon,title,description}:{icon:ReactNode;title:string;description:string}){
 return <div className="erp-empty"><span className="erp-empty-icon" aria-hidden="true">{icon}</span><h4>{title}</h4><p>{description}</p></div>;
}
