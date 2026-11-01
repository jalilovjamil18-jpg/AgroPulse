'use client';
import {useEffect,useMemo,useState} from 'react';
import {Activity,AlertTriangle,BarChart3,CalendarDays,FileBarChart2,Landmark,MapPin,RadioTower,RefreshCw,ShieldCheck,Sprout,Waves} from 'lucide-react';
import {apiRequest,type Role} from '@/lib/realApi';
import {useLanguage} from '@/components/LanguageProvider';

type ReadingShort={station_id:number;station_code:string;recorded_at:string;flow_lps:string;level_cm:string|null;source:string};
type CanalRow={id:number;name:string;code:string;area_id:number|null;stations:number;samples_in_period:number;latest_sample:ReadingShort|null};
type AreaRow={id:number;name:string;canal_count:number;station_count:number;field_count:number;field_area_ha:string};
type RoleOverview={role:Role;demo:false;period:{from:string;to:string;max_days:number};truncated:boolean;notice:string;
 observations:{samples:number;stations_total:number;stations_with_samples:number;daily_observed_flow:{day:string;samples:number;mean_observed_flow_lps:string}[];latest_per_station:ReadingShort[]};
 authority?:{areas:AreaRow[];canals:CanalRow[];field_area_ha:string;open_alerts:{id:number;title:string;description:string;created_at:string;canal_id:number|null}[];caveat:string};
 irrigation?:{canals:{id:number;code:string;name:string;station_count:number;observations_in_period:number;latest_in_period:ReadingShort|null}[];stations:{id:number;code:string;canal:string;enabled:boolean;latest_in_period:ReadingShort|null}[];open_alerts:{id:number;title:string;created_at:string}[]};
 farmer?:{fields:{id:number;name:string;crop:string;area_ha:string;canal_id:number|null}[];field_count:number;assigned_canals_count:number;message:string};};
const translations={
 uz:{title:'Hududiy boshqaruv',farmer:'Mening dalalarim',irrigation:'Kanallar monitoringi',authority:'Qorako‘l tumani: real ko‘rsatkichlar',admin:'Tizim nazorati',from:'Boshlanish',to:'Tugash',apply:'Ko‘rsatish',noData:'Hozircha qaydlar yo‘q',samples:'Qayd etilgan o‘lchovlar',covered:'Ma’lumotli sensorlar',canals:'Kanallar',areas:'Hududlar',fields:'Maydonlar',alerts:'Ochiq ogohlantirishlar',status:'Holati',live:'Bazadagi haqiqiy yozuvlar',empty:'Hozircha tasdiqlangan ko‘rsatkichlar yo‘q.',flow:'Oxirgi oqim',daily:'Kunlik o‘rtacha qayd etilgan oqim (l/s)',station:'Sensor',last:'Oxirgi qayd',name:'Nomi',area:'Maydon, ga',measure:'Davrdagi o‘lchovlar',cover:'Monitoring qamrovi',missing:'Ma’lumot yo‘q',limit:'180 kungacha davr tanlanadi',partial:'Eslatma: ko‘p yozuv sabab faqat dastlabki 10 000 qayd ko‘rsatildi.',scoped:'Ma’lumotlar foydalanuvchi vakolatiga qarab cheklangan',note:'L/s — suv oqimining oniy qiymati. Bu suvning umumiy m³ hajmi emas.',error:'Ma’lumot olishda xatolik',data:'Haqiqiy baza',district:'Tuman',stations:'Sensorlar',update:'Yangilash',read:'Boshqaruv paneli uchun suv ma’lumotlari',report:'Monitoring jadvali'},
 ru:{title:'Региональное управление',farmer:'Мои поля',irrigation:'Мониторинг каналов',authority:'Каракульский район: реальные данные',admin:'Администрирование',from:'С',to:'По',apply:'Показать',noData:'Записей пока нет',samples:'Измерения',covered:'Датчики с данными',canals:'Каналы',areas:'Участки',fields:'Поля',alerts:'Открытые уведомления',status:'Статус',live:'Данные из базы',empty:'Подтверждённых показателей пока нет.',flow:'Последний расход',daily:'Средний расход наблюдений по дням (л/с)',station:'Датчик',last:'Последнее измерение',name:'Название',area:'Площадь, га',measure:'Измерения за период',cover:'Охват мониторинга',missing:'Нет данных',limit:'Период до 180 дней',partial:'Показаны первые 10 000 записей.',scoped:'Доступ ограничен назначенными правами',note:'Л/с — мгновенный расход, не общий объём м³.',error:'Ошибка загрузки',data:'Реальная база',district:'Район',stations:'Датчики',update:'Обновить',read:'Данные системы мониторинга',report:'Таблица мониторинга'},
 en:{title:'Area management',farmer:'My fields',irrigation:'Canal monitoring',authority:'Qorako‘l district: real observations',admin:'Administration',from:'From',to:'To',apply:'Show',noData:'No records yet',samples:'Measurements recorded',covered:'Stations with readings',canals:'Canals',areas:'Areas',fields:'Fields',alerts:'Open alerts',status:'Status',live:'Verified database records',empty:'No verified measurements available yet.',flow:'Latest flow',daily:'Daily mean of observed flow samples (l/s)',station:'Station',last:'Latest reading',name:'Name',area:'Area, ha',measure:'Readings in period',cover:'Monitoring coverage',missing:'No readings',limit:'Choose up to 180 days',partial:'Only first 10,000 records included.',scoped:'Only authorized data is shown',note:'l/s is instantaneous flow rate, not cumulative volume in m³.',error:'Failed to load readings',data:'Live database',district:'District',stations:'Stations',update:'Refresh',read:'Monitoring data',report:'Monitoring table'}
};
function dateBefore(n:number){const d=new Date();d.setDate(d.getDate()-n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function readable(v:string|null|undefined){return v===null||v===undefined||v===''?'—':v}
function dateFormat(value:string){const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString()}
export default function PilotRoleInsights({token,role,refreshKey=0}:{token:string;role:Role;refreshKey?:number}){
 const {language}=useLanguage();const l=translations[language==='ru'?'ru':language==='en'?'en':'uz'];
 const [from,setFrom]=useState('');const [to,setTo]=useState('');
 const [range,setRange]=useState<{from:string;to:string}|null>(null);
 useEffect(()=>{const start=dateBefore(29),end=dateBefore(0);setFrom(start);setTo(end);setRange({from:start,to:end});},[]);
 const [result,setResult]=useState<RoleOverview|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{if(!range)return;let active=true;setBusy(true);setError('');
  const params=new URLSearchParams(range);
  apiRequest<RoleOverview>('/dashboard/role/?'+params.toString(),token).then(d=>{if(active)setResult(d)}).catch(e=>{if(active){setError(e instanceof Error?e.message:l.error);setResult(null)}}).finally(()=>{if(active)setBusy(false)});
  return()=>{active=false};
 },[token,range,refreshKey,l.error]);
 const series=result?.observations.daily_observed_flow||[];
 const peak=useMemo(()=>Math.max(1,...series.map(p=>Number(p.mean_observed_flow_lps)||0)),[series]);
 const title=l[role];
 return <div className="ap-role-dashboard" aria-label={title}>
  <div className="ap-role-heading"><div><span className="ap-real-kicker">AGROPULSE / QORAKO‘L / {l.data}</span><h2>{role==='authority'?<Landmark size={24}/>:role==='farmer'?<Sprout size={24}/>:role==='irrigation'?<Waves size={24}/>:<ShieldCheck size={24}/>} {title}</h2><p>{l.scoped}</p></div>
   <form className="ap-role-period" onSubmit={e=>{e.preventDefault();if(from&&to)setRange({from,to})}}><label>{l.from}<input aria-label={l.from} type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)} required/></label><label>{l.to}<input aria-label={l.to} type="date" value={to} max={dateBefore(0)} onChange={e=>setTo(e.target.value)} required/></label><button disabled={busy} type="submit"><RefreshCw size={15}/>{l.apply}</button></form>
  </div>
  {busy&&<p role="status" className="ap-role-muted">{l.update}…</p>}
  {error&&<p role="alert" className="ap-real-message error">{error}</p>}
  {result&&<>
   <div className="ap-role-kpis">
    {[{icon:Activity,label:l.samples,val:result.observations.samples},{icon:RadioTower,label:l.covered,val:`${result.observations.stations_with_samples} / ${result.observations.stations_total}`},{icon:Waves,label:l.canals,val:(result.authority?.canals||result.irrigation?.canals||[]).length||result.farmer?.assigned_canals_count||0},{icon:AlertTriangle,label:role==='farmer'?l.fields:l.alerts,val:role==='farmer'?result.farmer?.field_count:(result.authority?.open_alerts||result.irrigation?.open_alerts||[]).length}].map(item=>{const Icon=item.icon;return <div className="ap-role-kpi" key={item.label}><Icon size={21}/><small>{item.label}</small><strong>{item.val??'—'}</strong></div>})}
   </div>
   <div className="ap-role-columns">
    <section className="ap-role-box"><h3><BarChart3 size={19}/>{l.daily}</h3>
     {series.length?<div className="ap-role-chart" aria-label={l.daily}>{series.map(p=><div className="ap-role-bar-col" title={`${p.day}: ${p.mean_observed_flow_lps} l/s, ${p.samples}`} key={p.day}><div className="ap-role-bar" style={{height:`${Math.max(4,Number(p.mean_observed_flow_lps)/peak*100)}%`}}/><span>{p.day.slice(5)}</span></div>)}</div>:<p className="ap-real-empty">{l.empty}</p>}
     <p className="ap-role-muted">{l.note}</p>
    </section>
    <section className="ap-role-box"><h3><RadioTower size={19}/>{l.cover}</h3><div className="ap-role-coverage">{result.observations.stations_total===0?l.noData:`${result.observations.stations_with_samples} / ${result.observations.stations_total}`}</div><p className="ap-role-muted">{l.measure}: {result.observations.samples}. {l.limit}</p>
      {result.authority&&<div className="ap-role-minilist"><strong>{l.areas}</strong><span>{result.authority.areas.length}</span><strong>{l.area}</strong><span>{result.authority.field_area_ha}</span></div>}
      {result.irrigation&&<div className="ap-role-minilist"><strong>{l.stations}</strong><span>{result.irrigation.stations.length}</span><strong>{l.alerts}</strong><span>{result.irrigation.open_alerts.length}</span></div>}
      {result.farmer&&<p className="ap-role-muted">{result.farmer.message}</p>}
    </section>
   </div>
   {result.authority&&<div className="ap-role-columns"><section className="ap-role-box"><h3><MapPin size={19}/>{l.areas}</h3>{result.authority.areas.length?<div className="ap-real-table-scroll"><table><thead><tr><th>{l.name}</th><th>{l.canals}</th><th>{l.stations}</th><th>{l.fields}</th><th>{l.area}</th></tr></thead><tbody>{result.authority.areas.map(a=><tr key={a.id}><td>{a.name}</td><td>{a.canal_count}</td><td>{a.station_count}</td><td>{a.field_count}</td><td>{a.field_area_ha}</td></tr>)}</tbody></table></div>:<p className="ap-real-empty">{l.noData}</p>}</section>
    <section className="ap-role-box"><h3><Waves size={19}/>{l.canals}</h3><div className="ap-role-scroll">{result.authority.canals.length?result.authority.canals.map(c=><article className="ap-role-list-row" key={c.id}><div><strong>{c.name}</strong><small>{c.code} • {c.stations} {l.stations}</small></div><div><strong>{c.latest_sample?`${c.latest_sample.flow_lps} l/s`:'—'}</strong><small>{c.latest_sample?dateFormat(c.latest_sample.recorded_at):l.missing}</small></div></article>):<p className="ap-real-empty">{l.noData}</p>}</div></section></div>}
   {result.irrigation&&<section className="ap-role-box"><h3><RadioTower size={19}/>{l.stations}</h3><div className="ap-real-table-scroll"><table><thead><tr><th>{l.station}</th><th>{l.canals}</th><th>{l.status}</th><th>{l.flow}</th><th>{l.last}</th></tr></thead><tbody>{result.irrigation.stations.map(s=><tr key={s.id}><td>{s.code}</td><td>{s.canal}</td><td>{s.enabled?'On':'Off'}</td><td>{s.latest_in_period?`${s.latest_in_period.flow_lps} l/s`:'—'}</td><td>{s.latest_in_period?dateFormat(s.latest_in_period.recorded_at):'—'}</td></tr>)}</tbody></table>{!result.irrigation.stations.length&&<p className="ap-real-empty">{l.empty}</p>}</div></section>}
   {result.farmer&&<section className="ap-role-box"><h3><Sprout size={19}/>{l.fields}</h3><div className="ap-real-table-scroll"><table><thead><tr><th>{l.name}</th><th>{l.area}</th><th>{l.canals}</th></tr></thead><tbody>{result.farmer.fields.map(f=><tr key={f.id}><td>{f.name} {f.crop&&<small>({f.crop})</small>}</td><td>{f.area_ha}</td><td>{f.canal_id??'—'}</td></tr>)}</tbody></table>{!result.farmer.fields.length&&<p className="ap-real-empty">{l.empty}</p>}</div></section>}
   {!!(result.authority?.open_alerts.length||result.irrigation?.open_alerts.length)&&<section className="ap-role-box"><h3><AlertTriangle size={19}/>{l.alerts}</h3>{(result.authority?.open_alerts||result.irrigation?.open_alerts||[]).map(a=><article key={a.id} className="ap-role-list-row"><span>{a.title}</span><small>{dateFormat(a.created_at)}</small></article>)}</section>}
   {result.truncated&&<p className="ap-role-warning">{l.partial}</p>}
   <p className="ap-role-muted">{result.authority?.caveat||result.notice}</p>
  </>}
 </div>;
}
