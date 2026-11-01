'use client';

import {useEffect,useState} from 'react';
import {CalendarRange,FileCheck2,Landmark,ShieldCheck,Waves} from 'lucide-react';
import {apiRequest} from '@/lib/realApi';
import {useLanguage} from '@/components/LanguageProvider';

type AnnualRow={area_id:number;area:string;planned_m3:string|null;actual_m3:string|null;utilization_pct:string|null;months_verified:number;paired_months:number;document_count:number};
type AnnualData={
  district:{id:number;name:string};year:number;through_month:number;unit:string;demo:false;
  areas_total:number;areas_with_records:number;verified_area_months:number;expected_area_months:number;coverage_pct:string|null;
  planned_m3:string|null;actual_m3:string|null;areas_with_plan:number;areas_with_actual:number;paired_utilization_pct:string|null;
  rows:AnnualRow[];missing_areas:{id:number;name:string}[];notice:string;
};

const copy={
 uz:{title:'Yillik suv balansi',intro:'Faqat administrator tasdiqlagan oylik hujjatlar yig‘indisi.',year:'Hisobot yili',show:'Ko‘rsatish',planned:'Yillik reja',actual:'Yillik amaldagi hajm',coverage:'Hudud-oy qamrovi',utilization:'Rejaga nisbatan',area:'Hudud',plan:'Reja (m³)',actualShort:'Amalda (m³)',months:'Qamrab olingan oylar',documents:'Hudud-oy yozuvlari',empty:'Tanlangan yil uchun tasdiqlangan hujjat topilmadi.',missing:'Ma’lumoti yo‘q hududlar',note:'Joriy yil bo‘yicha qamrov yanvar oyidan hozirgi oygacha hisoblanadi. Qisman hujjatlar to‘liq yil natijasi emas.',loading:'Yuklanmoqda...',error:'Yillik suv balansi yuklanmadi.'},
 ru:{title:'Годовой водный баланс',intro:'Сумма только ежемесячных документов, утверждённых администратором.',year:'Отчётный год',show:'Показать',planned:'Годовой план',actual:'Фактический объём',coverage:'Охват по зонам и месяцам',utilization:'Исполнение плана',area:'Участок',plan:'План (м³)',actualShort:'Факт (м³)',months:'Месяцы с данными',documents:'Записи по зонам и месяцам',empty:'Нет утверждённых документов за выбранный год.',missing:'Зоны без данных',note:'Для текущего года охват считается с января по текущий месяц. Неполные документы не являются итогом полного года.',loading:'Загрузка...',error:'Не удалось загрузить годовой баланс.'},
 en:{title:'Annual water balance',intro:'Sum of monthly records approved by an administrator only.',year:'Reporting year',show:'Apply',planned:'Annual plan',actual:'Recorded annual volume',coverage:'Area-month coverage',utilization:'Plan utilization',area:'Area',plan:'Plan (m³)',actualShort:'Actual (m³)',months:'Months covered',documents:'Area-month records',empty:'No approved documents were found for this year.',missing:'Areas without records',note:'For the current year, coverage runs from January through the current month. Partial records are not a full-year result.',loading:'Loading...',error:'Could not load annual water balance.'}
};

function number(value:string|null,lang:string){if(value===null)return '—';return new Intl.NumberFormat(lang==='uz'?'uz-UZ':lang==='ru'?'ru-RU':'en-GB',{maximumFractionDigits:3}).format(Number(value));}

export default function PilotAnnualWaterBalance({token}:{token:string}){
 const {language}=useLanguage();const lang=language==='ru'?'ru':language==='en'?'en':'uz';const t=copy[lang];
 const [year,setYear]=useState(String(new Date().getFullYear()));
 const [applied,setApplied]=useState(String(new Date().getFullYear()));
 const [data,setData]=useState<AnnualData|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{let active=true;setBusy(true);setError('');
   apiRequest<AnnualData>(`/dashboard/water-balance/annual/?year=${encodeURIComponent(applied)}`,token)
    .then(value=>{if(active)setData(value)})
    .catch(err=>{if(active){setData(null);setError(err instanceof Error?err.message:t.error)}})
    .finally(()=>{if(active)setBusy(false)});
   return()=>{active=false};
 },[token,applied,t.error]);
 const maxYear=new Date().getFullYear();
 const years=Array.from({length:maxYear-2019},(_,i)=>String(maxYear-i));
 return <section className="ap-annual-balance">
  <header className="ap-annual-head"><div><span className="ap-real-kicker">QORAKO‘L / HOKIMIYAT / TASDIQLANGAN MA’LUMOT</span><h2><Landmark size={22}/>{t.title}</h2><p>{t.intro}</p></div>
   <form onSubmit={e=>{e.preventDefault();setApplied(year)}}><label><CalendarRange size={15}/>{t.year}<select value={year} onChange={e=>setYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></label><button type="submit" disabled={busy}>{t.show}</button></form>
  </header>
  {busy&&<p className="ap-role-muted">{t.loading}</p>}
  {error&&<p role="alert" className="ap-real-message error">{t.error} {error}</p>}
  {data&&<>
   <div className="ap-annual-kpis">
    <article><Waves size={19}/><span>{t.planned}</span><strong>{number(data.planned_m3,lang)} <small>{data.planned_m3!==null?'m³':''}</small></strong><em>{data.areas_with_plan}/{data.areas_total} {t.area.toLowerCase()}</em></article>
    <article><FileCheck2 size={19}/><span>{t.actual}</span><strong>{number(data.actual_m3,lang)} <small>{data.actual_m3!==null?'m³':''}</small></strong><em>{data.areas_with_actual}/{data.areas_total} {t.area.toLowerCase()}</em></article>
    <article><ShieldCheck size={19}/><span>{t.coverage}</span><strong>{number(data.coverage_pct,lang)} <small>{data.coverage_pct!==null?'%':''}</small></strong><em>{data.verified_area_months}/{data.expected_area_months} {t.documents.toLowerCase()}</em></article>
    <article><Waves size={19}/><span>{t.utilization}</span><strong>{number(data.paired_utilization_pct,lang)} <small>{data.paired_utilization_pct!==null?'%':''}</small></strong><em>{data.through_month}/{12} {t.months.toLowerCase()}</em></article>
   </div>
   {data.rows.length?<div className="ap-real-table-scroll"><table><thead><tr><th>{t.area}</th><th>{t.plan}</th><th>{t.actualShort}</th><th>{t.utilization}</th><th>{t.months}</th><th>{t.documents}</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.area_id}><td>{row.area}</td><td>{number(row.planned_m3,lang)}</td><td>{number(row.actual_m3,lang)}</td><td>{row.utilization_pct===null?'—':number(row.utilization_pct,lang)+'%'}</td><td>{row.months_verified}</td><td>{row.document_count}</td></tr>)}</tbody></table></div>:<p className="ap-real-empty">{t.empty}</p>}
   {data.missing_areas.length>0&&<div className="ap-annual-missing"><strong>{t.missing}</strong><div>{data.missing_areas.map(area=><span key={area.id}>{area.name}</span>)}</div></div>}
   <p className="ap-period-note">{data.notice} {t.note}</p>
  </>}
 </section>;
}
