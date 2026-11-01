'use client';
import {useEffect,useMemo,useState} from 'react';
import {Activity,RefreshCw,RadioTower,ShieldCheck} from 'lucide-react';
import {apiRequest,type Role} from '@/lib/realApi';
import {useLanguage} from '@/components/LanguageProvider';

type State='unprovisioned'|'awaiting_data'|'recent_receipt'|'old_receipt'|'disabled';
type DeviceRow={id:number;code:string;name:string;canal:string;canal_id:number;is_enabled:boolean;provisioned:boolean;last_device_ingest_at:string|null;last_device_measurement_at:string|null;state:State};
type Monitor={demo:false;role:Role;checked_at:string;recent_threshold_hours:number;stations_total:number;listed_stations:number;truncated:boolean;counts:Record<State,number>;stations:DeviceRow[];notice:string};
const tr={
 uz:{heading:'Qurilmalar monitoringi',desc:'Qurilma kaliti bilan kelgan o‘lchovlarning serverga qabul qilinish holati',refresh:'Yangilash',search:'Punkt yoki kanalni qidirish…',all:'Barchasi',recent_receipt:'48 soatda qabul qilingan',old_receipt:'48 soatdan eski qabul',awaiting_data:'Hali ma’lumot kelmagan',unprovisioned:'Kalit biriktirilmagan',disabled:'O‘chirilgan',station:'Monitoring punkti',canal:'Kanal',lastReceipt:'Oxirgi qabul',lastMeasure:'Oxirgi qurilma o‘lchovi',status:'Holat',empty:'Hozircha ro‘yxatda punkt yo‘q.',noMatches:'Filtrga mos punkt topilmadi.',truncated:'Faqat birinchi 500 punkt ko‘rsatilmoqda. Umumiy son yuqorida.',note:'«Qabul» serverga so‘rov muvaffaqiyatli kelganini bildiradi; u qurilmaning hozir online ekanini tasdiqlamaydi.',error:'Ma’lumotlarni olishda xatolik',secure:'Faqat sizning hududingizdagi punktlar'},
 ru:{heading:'Мониторинг устройств',desc:'Приём показаний от устройств с ключом авторизации',refresh:'Обновить',search:'Поиск пункта или канала…',all:'Все',recent_receipt:'Принято за 48 ч',old_receipt:'Давность приёма >48 ч',awaiting_data:'Приёмов пока не было',unprovisioned:'Нет ключа устройства',disabled:'Отключено',station:'Пункт',canal:'Канал',lastReceipt:'Последний приём',lastMeasure:'Время измерения',status:'Состояние',empty:'Пунктов пока нет.',noMatches:'Совпадений нет.',truncated:'Показаны только первые 500 пунктов.',note:'Приём на сервере не подтверждает, что устройство сейчас онлайн.',error:'Ошибка загрузки',secure:'Пункты в пределах ваших прав'},
 en:{heading:'Device monitoring',desc:'Server receipts from authenticated device submissions',refresh:'Refresh',search:'Find a station or canal…',all:'All',recent_receipt:'Received within 48h',old_receipt:'Receipt older than 48h',awaiting_data:'No device receipts yet',unprovisioned:'No device key',disabled:'Disabled',station:'Monitoring station',canal:'Canal',lastReceipt:'Last server receipt',lastMeasure:'Last device measurement',status:'Status',empty:'No stations have been registered.',noMatches:'No matching stations.',truncated:'Only first 500 stations shown.',note:'A successful server receipt does not prove that a physical sensor is currently online.',error:'Could not load device information',secure:'Only stations within your authorized scope'}
};
const codes:State[]=['recent_receipt','old_receipt','awaiting_data','unprovisioned','disabled'];
export default function PilotDeviceMonitoring({token,role,refreshKey=0}:{token:string;role:Role;refreshKey?:number}){
 const {language}=useLanguage();const lang=language==='ru'?'ru':language==='en'?'en':'uz';const t=tr[lang];
 const [data,setData]=useState<Monitor|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [tick,setTick]=useState(0);
 const [filter,setFilter]=useState<State|'all'>('all');const [query,setQuery]=useState('');
 useEffect(()=>{if(role==='farmer')return;let active=true;setLoading(true);setError('');apiRequest<Monitor>('/dashboard/devices/',token)
  .then(result=>{if(active)setData(result)}).catch(err=>{if(active){setData(null);setError(err instanceof Error?err.message:t.error)}}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};},[token,role,refreshKey,tick,t.error]);
 const list=useMemo(()=>data?.stations.filter(r=>(filter==='all'||r.state===filter) && (r.name+' '+r.code+' '+r.canal).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))||[],[data,filter,query]);
 const format=(v:string|null)=>v?new Date(v).toLocaleString(lang==='ru'?'ru-RU':lang==='uz'?'uz-UZ':'en-GB',{dateStyle:'short',timeStyle:'short'}):'—';
 if(role==='farmer')return null;
 return <section className="ap-quality" aria-label={t.heading}>
  <div className="ap-quality-head"><div><span className="ap-real-kicker">QORAKO‘L / REAL API</span><h2><RadioTower size={22}/>{t.heading}</h2><p>{t.desc}</p></div><button type="button" disabled={loading} onClick={()=>setTick(v=>v+1)}><RefreshCw size={16}/>{loading?'…':t.refresh}</button></div>
  {error&&<div className="ap-real-message error" role="alert">{t.error}: {error}</div>}
  {data&&<>
   <div className="ap-device-counts">{codes.map(code=><button key={code} type="button" aria-pressed={filter===code} className={'ap-device-card '+(filter===code?'active':'')} onClick={()=>setFilter(s=>s===code?'all':code)}><Activity size={19}/><small>{t[code]}</small><strong>{data.counts[code]}</strong></button>)}</div>
   <div className="ap-device-toolbar"><label><span>{t.station}:</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></label><button type="button" onClick={()=>{setFilter('all');setQuery('')}}>{t.all} ({data.stations_total})</button></div>
   {data.truncated&&<p className="ap-real-message error">{t.truncated}</p>}
   <p className="ap-quality-note"><ShieldCheck size={15} style={{verticalAlign:'middle',marginRight:6}}/>{t.secure}. {t.note}</p>
   {list.length?<div className="ap-real-table-scroll"><table><thead><tr><th>{t.station}</th><th>{t.canal}</th><th>{t.lastReceipt}</th><th>{t.lastMeasure}</th><th>{t.status}</th></tr></thead><tbody>{list.map(r=><tr key={r.id}><td><strong>{r.name}</strong><div><small>{r.code}</small></div></td><td>{r.canal}</td><td>{format(r.last_device_ingest_at)}</td><td>{format(r.last_device_measurement_at)}</td><td><span className={'ap-device-state '+r.state}>{t[r.state]}</span></td></tr>)}</tbody></table></div>:<p className="ap-real-empty">{data.stations.length?t.noMatches:t.empty}</p>}
  </>}
 </section>;
}
