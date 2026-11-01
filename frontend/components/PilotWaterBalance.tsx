'use client';
import {useEffect,useMemo,useState} from 'react';
import {BookCheck,CalendarRange,Download,FileCheck2,Landmark,RefreshCw,ShieldCheck,TriangleAlert,Waves} from 'lucide-react';
import {useLanguage} from '@/components/LanguageProvider';
import {API_BASE,apiRequest} from '@/lib/realApi';

type Row={area_id:number;area:string;planned_m3:string|null;actual_m3:string|null;utilization_pct:string|null;source_document:string;verified_at:string};
type Balance={district:{id:number;name:string};month:string;unit:string;areas_total:number;areas_verified:number;draft_count:number;planned_m3:string|null;actual_m3:string|null;paired_utilization_pct:string|null;areas_with_plan:number;areas_with_actual:number;areas_with_both:number;planned_complete:boolean;actual_complete:boolean;rows:Row[];missing_areas:{id:number;name:string}[];notice:string};
const labels={
 uz:{title:'Oylik suv balansi',intro:'Tasdiqlangan hujjatlar asosida hududlar bo‘yicha reja va amaldagi m³. Sensor oqimi bilan aralashtirilmaydi.',month:'Hisobot oyi',show:'Ko‘rsatish',csv:'CSV hisobot',planned:'Rejalashtirilgan suv',actual:'Amalda qayd etilgan',coverage:'Tasdiqlangan hududlar',paired:'Rejaga nisbatan foydalanish',source:'Asos hujjat',area:'Hudud',verified:'Tasdiqlangan',missing:'Ma’lumoti yo‘q hududlar',draft:'Tasdiq kutilayotgan yozuvlar',none:'Tasdiqlangan suv balansi yo‘q. Administrator hujjat asosida kiritishi va tasdiqlashi kerak.',partial:'Qisman ma’lumot',complete:'To‘liq qamrov',unit:'m³',error:'Suv balansi API javob bermadi.',disclaimer:'Faqat tasdiqlangan hujjatli m³ qiymatlar. Ma’lumot mavjud bo‘lmagan hududlar umumiy yig‘indiga qo‘shilmagan. Sensor l/s yozuvlaridan hajm hisoblanmagan.',verifiedAt:'Tasdiqlash sanasi'},
 ru:{title:'Месячный водный баланс',intro:'План и фактический объём м³ по зонам только по утверждённым документам.',month:'Месяц',show:'Показать',csv:'Скачать CSV',planned:'Плановый объём',actual:'Фактический объём',coverage:'Подтверждённые зоны',paired:'Исполнение плана',source:'Документ-основание',area:'Зона',verified:'Подтверждено',missing:'Зоны без данных',draft:'Ожидают подтверждения',none:'Подтверждённых данных нет. Администратор должен внести и проверить документы.',partial:'Неполные данные',complete:'Полный охват',unit:'м³',error:'Ошибка API водного баланса.',disclaimer:'Только подтверждённые документальные м³. Отсутствующие зоны исключены из итогов. Объём не рассчитывается по мгновенному потоку л/с.',verifiedAt:'Дата подтверждения'},
 en:{title:'Monthly water balance',intro:'Document-verified planned and recorded m³ by area, separate from sensor flow samples.',month:'Month',show:'Apply',csv:'Download CSV',planned:'Planned volume',actual:'Recorded volume',coverage:'Verified areas',paired:'Utilization versus plan',source:'Source document',area:'Area',verified:'Verified',missing:'Areas without records',draft:'Awaiting approval',none:'No verified water balance yet. An administrator must enter and approve official documents.',partial:'Partial coverage',complete:'Complete coverage',unit:'m³',error:'Water balance API error.',disclaimer:'Document-verified m³ only. Missing areas are excluded from totals. No volume is inferred from instantaneous l/s sensor readings.',verifiedAt:'Verified on'}
};
function currentMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function n(value:string|null){return value===null?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(Number(value))}
export default function PilotWaterBalance({token,refreshKey=0}:{token:string;refreshKey?:number}){
 const {language}=useLanguage();const L=labels[language==='ru'?'ru':language==='en'?'en':'uz'];
 const [month,setMonth]=useState(currentMonth);
 const [applied,setApplied]=useState(currentMonth);
 const [data,setData]=useState<Balance|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{let mounted=true;setBusy(true);setError('');apiRequest<Balance>(`/dashboard/water-balance/?month=${encodeURIComponent(applied)}`,token).then(d=>{if(mounted)setData(d)}).catch(e=>{if(mounted){setError(e instanceof Error?e.message:L.error);setData(null)}}).finally(()=>{if(mounted)setBusy(false)});return()=>{mounted=false}},[applied,refreshKey,token,L.error]);
 const available=data?.rows??[];
 const score=useMemo(()=>data?.areas_total?Math.min(100,available.length/data.areas_total*100):0,[data,available.length]);
 async function exportCsv(){if(!data)return;setBusy(true);setError('');try{const response=await fetch(`${API_BASE}/reports/water-balance.csv?month=${encodeURIComponent(applied)}`,{headers:{Authorization:`Token ${token}`}});if(!response.ok)throw new Error(`CSV (${response.status})`);const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`agropulse_balance_${applied}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}catch(err){setError(err instanceof Error?err.message:L.error)}finally{setBusy(false)}}
 return <section className="ap-balance" aria-label={L.title}>
  <header className="ap-balance-head"><div><span className="ap-real-kicker">QORAKO‘L / HOKIMIYAT / TASDIQLANGAN HISOBOT</span><h2><Landmark size={25}/>{L.title}</h2><p>{L.intro}</p></div><form onSubmit={e=>{e.preventDefault();if(month)setApplied(month)}} className="ap-balance-tools"><label><CalendarRange size={14}/>{L.month}<input type="month" required value={month} onChange={e=>setMonth(e.target.value)}/></label><button type="submit" disabled={busy}><RefreshCw size={15}/>{L.show}</button><button type="button" disabled={busy||!data} onClick={exportCsv}><Download size={15}/>{L.csv}</button></form></header>
  {busy&&<p role="status" className="ap-role-muted">Yuklanmoqda…</p>}
  {error&&<p role="alert" className="ap-real-message error">{error}</p>}
  {data&&<>
   <div className="ap-balance-kpis">
    <article><Waves size={20}/><span>{L.planned}</span><strong>{n(data.planned_m3)} <small>{data.planned_m3!==null?L.unit:''}</small></strong><em>{data.planned_complete?L.complete:L.partial} · {data.areas_with_plan}/{data.areas_total}</em></article>
    <article><BookCheck size={20}/><span>{L.actual}</span><strong>{n(data.actual_m3)} <small>{data.actual_m3!==null?L.unit:''}</small></strong><em>{data.actual_complete?L.complete:L.partial} · {data.areas_with_actual}/{data.areas_total}</em></article>
    <article><ShieldCheck size={20}/><span>{L.coverage}</span><strong>{data.areas_verified} / {data.areas_total}</strong><div className="ap-balance-progress" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${score}%`}}/></div></article>
    <article><FileCheck2 size={20}/><span>{L.paired}</span><strong>{n(data.paired_utilization_pct)} <small>{data.paired_utilization_pct!==null?'%':''}</small></strong><em>{data.areas_with_both} / {data.areas_total} · {L.area.toLowerCase()}</em></article>
   </div>
   <section className="ap-role-box"><div className="ap-balance-table-head"><h3>{L.area} · {data.month}</h3><span>{L.verified}: {data.rows.length}</span></div>
    {available.length?<div className="ap-real-table-scroll"><table><thead><tr><th>{L.area}</th><th>{L.planned} (m³)</th><th>{L.actual} (m³)</th><th>{L.paired}</th><th>{L.source}</th><th>{L.verifiedAt}</th></tr></thead><tbody>{available.map(x=><tr key={x.area_id}><td><b>{x.area}</b></td><td>{n(x.planned_m3)}</td><td>{n(x.actual_m3)}</td><td>{x.utilization_pct===null?'—':n(x.utilization_pct)+'%'}</td><td>{x.source_document}</td><td>{new Date(x.verified_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>:<p className="ap-real-empty">{L.none}</p>}
   </section>
   <div className="ap-balance-bottom"><div className="ap-role-box"><h3><TriangleAlert size={18}/>{L.missing} ({data.missing_areas.length})</h3>{data.missing_areas.length?<div className="ap-balance-tags">{data.missing_areas.map(a=><span key={a.id}>{a.name}</span>)}</div>:<p className="ap-role-muted">—</p>}</div><div className="ap-role-box"><h3><FileCheck2 size={18}/>{L.draft}: {data.draft_count}</h3><p className="ap-role-muted">{L.disclaimer}</p></div></div>
  </>}
 </section>;
}
