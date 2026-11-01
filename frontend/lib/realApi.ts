/** Real pilot API. Never use dashboard demo data as live statistics. */
export const API_BASE=(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/,'');
export type Role='farmer'|'irrigation'|'authority'|'admin';
export type User={username:string;full_name:string;role:Role;district:{id:number;name:string}|null;is_superuser:boolean};
export type Summary={pilot:string;demo:false;data_source:string;user:User;counts:{areas:number;canals:number;fields:number;stations:number;enabled_stations:number;readings:number;open_alerts:number};latest_reading:Reading|null;last_recorded_at:string|null;notice:string};
export type Area={id:number;name:string;district_id:number};
export type Canal={id:number;code:string;name:string;district_id:number;area_id:number|null};
export type Field={id:number;name:string;crop:string;area_ha:string;area_id:number|null;canal_id:number|null};
export type Station={id:number;code:string;name:string;canal:string;is_enabled:boolean;installed_at:string|null};
export type Reading={id:number;station_id:number;station_code:string;canal_id:number;recorded_at:string;flow_lps:string;level_cm:string|null;source:'manual'|'device'};
export type Alert={id:number;title:string;description:string;status:string;canal_id:number|null;created_at:string};
export type PilotData={summary:Summary;areas:Area[];canals:Canal[];fields:Field[];stations:Station[];readings:Reading[]};
export async function apiRequest<T>(path:string,token?:string,opts:RequestInit={}):Promise<T>{
 const res=await fetch(API_BASE+path,{...opts,headers:{...(opts.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Token ${token}`}:{}) ,...opts.headers},cache:'no-store'});
 if(!res.ok){let msg=`API xatosi (${res.status})`;try{const data=await res.json();msg=data.detail||data.non_field_errors?.[0]||JSON.stringify(data)}catch{}throw new Error(msg)}
 return res.json() as Promise<T>;
}
export async function loadPilotData(token:string):Promise<PilotData>{
 const [summary,areas,canals,fields,stations,readings]=await Promise.all([
  apiRequest<Summary>('/dashboard/summary/',token),
  apiRequest<Area[]>('/areas/',token),
  apiRequest<Canal[]>('/canals/',token),
  apiRequest<Field[]>('/fields/',token),
  apiRequest<Station[]>('/stations/',token),
  apiRequest<Reading[]>('/readings/',token),
 ]);
 return {summary,areas,canals,fields,stations,readings};
}
