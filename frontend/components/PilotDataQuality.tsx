'use client';
import {useEffect,useState} from 'react';
import {AlertTriangle,CheckCircle2,Database,RefreshCw,RadioTower,ShieldCheck} from 'lucide-react';
import {apiRequest,type Role} from '@/lib/realApi';
import {useLanguage} from '@/components/LanguageProvider';

type StationHealth={code:string;name:string;canal:string;status:'recent'|'stale'|'no_data'|'disabled';last_reading_at:string|null};
type Health={demo:false;counts:{recent:number;stale:number;no_data:number;disabled:number};stations_total:number;listed_stations:number;truncated:boolean;canals_total:number;canals_without_area:number;registered_areas:number;stations:StationHealth[];recent_threshold_hours:number;notice:string};
const strings={
 uz:{title:'Ma’lumotlar sifati',desc:'Oxirgi o‘lchovlar va hududga bog‘lanish holati',recent:'So‘nggi 48 soatda qayd',stale:'48 soatdan eski qayd',missing:'O‘lchov yo‘q',disabled:'O‘chirilgan punkt',unassigned:'Hududi ko‘rsatilmagan kanal',refresh:'Yangilash',station:'Monitoring punkti',canal:'Kanal',last:'Oxirgi o‘lchov',status:'Ma’lumot holati',empty:'Hozircha monitoring punkti qo‘shilmagan.',notice:'«Eski qayd» — qurilma offline degani emas. Sensor aloqasi alohida tekshiriladi.',error:'Ma’lumot sifati olinmadi',partial:'Faqat birinchi 500 ta punkt ko‘rsatilmoqda',verified:'Real baza / sintetik ma’lumot yo‘q'},
 ru:{title:'Качество данных',desc:'Давность измерений и привязка к участкам',recent:'Запись за 48 часов',stale:'Запись старше 48 часов',missing:'Нет измерений',disabled:'Отключённый пункт',unassigned:'Каналы без участка',refresh:'Обновить',station:'Пункт мониторинга',canal:'Канал',last:'Последнее измерение',status:'Состояние данных',empty:'Пункты мониторинга ещё не добавлены.',notice:'«Старая запись» не означает, что устройство отключено. Связь проверяется отдельно.',error:'Не удалось получить данные',partial:'Показаны первые 500 пунктов',verified:'Реальная база / без синтетических данных'},
 en:{title:'Data quality',desc:'Measurement freshness and area assignment',recent:'Recorded within 48h',stale:'Older than 48h',missing:'No measurements',disabled:'Disabled station',unassigned:'Canals without area',refresh:'Refresh',station:'Monitoring station',canal:'Canal',last:'Latest reading',status:'Data status',empty:'No monitoring stations registered yet.',notice:'A stale reading does not mean the device is offline. Connectivity is assessed separately.',error:'Could not load data quality',partial:'Only the first 500 stations are shown',verified:'Real database / no synthetic data'}
};
export default function PilotDataQuality({token,role,refreshKey=0}:{token:string;role:Role;refreshKey?:number}){
 const {language}=useLanguage();const t=strings[language==='ru'?'ru':language==='en'?'en':'uz'];
 const [result,setResult]=useState<Health|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [trigger,setTrigger]=useState(0);
 useEffect(()=>{if(role==='farmer')return;let active=true;setBusy(true);setError('');apiRequest<Health>('/dashboard/data-quality/',token).then(d=>{if(active)setResult(d)}).catch(e=>{if(active){setResult(null);setError(e instanceof Error?e.message:t.error)}}).finally(()=>{if(active)setBusy(false)});return()=>{active=false}},[token,role,refreshKey,trigger,t.error]);
 if(role==='farmer')return null;
 const metrics=[{key:'recent',label:t.recent,icon:CheckCircle2},{key:'stale',label:t.stale,icon:AlertTriangle},{key:'no_data',label:t.missing,icon:Database},{key:'disabled',label:t.disabled,icon:RadioTower}] as const;
 const stateName=(s:StationHealth['status'])=>({recent:t.recent,stale:t.stale,no_data:t.missing,disabled:t.disabled}[s]);
 return <section className="ap-quality" aria-label={t.title}>
  <header className="ap-quality-head"><div><span className="ap-real-kicker">QORAKO‘L / {t.verified}</span><h2><ShieldCheck size={21}/>{t.title}</h2><p>{t.desc}</p></div><button type="button" disabled={busy} onClick={()=>setTrigger(n=>n+1)}><RefreshCw size={16}/>{busy?'…':t.refresh}</button></header>
  {error&&<p className="ap-real-message error" role="alert">{t.error}: {error}</p>}
  {result&&<><div className="ap-quality-stats">{metrics.map(m=>{const Icon=m.icon;return <article key={m.key}><Icon size={20}/><small>{m.label}</small><strong>{result.counts[m.key]}</strong></article>})}</div>
  <p className="ap-quality-note">{t.notice} · {t.unassigned}: <b>{result.canals_without_area}</b> / {result.canals_total}</p>
  {result.truncated&&<p className="ap-real-message error">{t.partial}</p>}
  {result.stations.length?<div className="ap-real-table-scroll"><table><thead><tr><th>{t.station}</th><th>{t.canal}</th><th>{t.last}</th><th>{t.status}</th></tr></thead><tbody>{result.stations.map(s=><tr key={s.code}><td>{s.name} <small>({s.code})</small></td><td>{s.canal}</td><td>{s.last_reading_at?new Date(s.last_reading_at).toLocaleString(language==='ru'?'ru-RU':language==='en'?'en-GB':'uz-UZ'):'—'}</td><td><span className={'ap-quality-state '+s.status}>{stateName(s.status)}</span></td></tr>)}</tbody></table></div>:<p className="ap-real-empty">{t.empty}</p>}</>}
 </section>;
}
