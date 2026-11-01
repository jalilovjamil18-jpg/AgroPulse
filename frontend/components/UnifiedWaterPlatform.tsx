'use client';

import {useMemo, useState} from 'react';
import {useLanguage} from '@/components/LanguageProvider';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight,
  BarChart3, Bell, CalendarDays, CheckCircle2, ChevronDown, ChevronRight,
  ClipboardList, Download, Droplets, FileBarChart, Gauge, LayoutDashboard,
  Leaf, MapPin, MapPinned, RadioTower, Search, Settings, ShieldCheck,
  Sprout, Thermometer, Waves, Wifi, X, type LucideIcon,
} from 'lucide-react';

type Lang='uz'|'ru'|'en';
type Role='farmer'|'irrigation'|'authority'|'admin';
type Section='overview'|'map'|'water'|'devices'|'analytics'|'reports'|'alerts'|'advice'|'settings';
type Period='week'|'month'|'year';
type Signal='flow'|'humidity'|'rain';
type T={uz:string;ru:string;en:string};
const tx=(uz:string,ru:string,en:string):T=>({uz,ru,en});
const STR={
  title:tx('Boshqaruv paneli','Панель управления','Dashboard overview'),
  demo:tx('Interaktiv demo · sintetik ma’lumotlar','Интерактивное демо · условные данные','Interactive demo · synthetic data'),
  selectRole:tx('Rolni ko‘rish','Выбрать роль','Preview role'),
  search:tx('Jadvaldan qidirish...','Поиск по таблице...','Search records...'),
  activity:tx('So‘nggi faoliyatlar','Последние события','Recent activity'),
  map:tx('Dalalar va kanallar xaritasi','Карта полей и каналов','Fields & canals map'),
  chart:tx('Suv va tuproq tahlili','Анализ воды и почвы','Water & soil analytics'),
  table:tx('So‘nggi yozuvlar','Последние записи','Recent records'),
  alert:tx('Ogohlantirishlar','Оповещения','Alerts'),
  export:tx('Demo CSV','Демо CSV','Demo CSV'),
  summary:tx('Barcha qiymatlar namunaviy. Haqiqiy API ulanmagan.','Все значения демонстрационные. Реальный API не подключён.','All figures are illustrative. No live API is connected.'),
  developed:tx('Ishlab chiqilgan (demo)','Разработано (демо)','Developed (demo)'),
  planned:tx('Reja / Konsept','План / Концепт','Planned / Concept'),
  view:tx('Ko‘rish','Открыть','View'),
  open:tx('Batafsil','Подробнее','Details'),
  noResults:tx('Mos yozuv topilmadi','Подходящих записей нет','No matching records'),
  roleDesc:tx('Foydalanuvchi rollari — faqat interfeys namoyishi.','Роли пользователей — только демонстрация интерфейса.','User roles shown for interface preview only.'),
} as const;
const roleData:{id:Role;icon:LucideIcon;label:T;headline:T;sub:T;stats:{name:T;value:string;icon:LucideIcon;trend:string;down?:boolean}[];series:number[]}[]=[
  {id:'farmer',icon:Sprout,label:tx('Fermer','Фермер','Farmer'),headline:tx('Mening maydonlarim','Мои поля','My fields'),sub:tx('Dalalar va sug‘orish holatining namunaviy ko‘rinishi','Пример состояния полей и орошения','Illustrative view of fields and irrigation'),stats:[{name:tx('Suv sarfi','Расход воды','Water usage'),value:'1 250 m³',icon:Droplets,trend:'−8%',down:true},{name:tx('Dalalar','Поля','Fields'),value:'3',icon:Sprout,trend:'+1'},{name:tx('Kuzatuv nuqtalari','Точки наблюдения','Monitoring points'),value:'4',icon:RadioTower,trend:'+1'},{name:STR.alert,value:'3',icon:Bell,trend:'Demo'}],series:[21,28,33,40,50,54,48,52,56,60,55,66]},
  {id:'irrigation',icon:Waves,label:tx('Irrigatsiya','Ирригация','Irrigation'),headline:tx('Kanallar nazorati','Мониторинг каналов','Canal overview'),sub:tx('Suv taqsimotini kuzatish uchun namuna panel','Пример панели распределения воды','Sample water distribution dashboard'),stats:[{name:tx('Kanallar','Каналы','Canals'),value:'3',icon:Waves,trend:'+1'},{name:tx('Oqim namunasi','Пример расхода','Sample flow'),value:'240 l/s',icon:Droplets,trend:'Demo'},{name:tx('O‘lchov nuqtalari','Точки измерения','Sensor sites'),value:'6',icon:RadioTower,trend:'+2'},{name:STR.alert,value:'2',icon:Bell,trend:'Demo'}],series:[35,33,42,48,44,57,60,54,61,58,68,64]},
  {id:'authority',icon:MapPinned,label:tx('Hokimiyat','Администрация','Local authority'),headline:tx('Hududiy ko‘rsatkichlar','Региональные показатели','Regional overview'),sub:tx('Hududlar bo‘yicha umumiy demo hisobot','Сводный демонстрационный отчёт','Aggregate sample indicators by area'),stats:[{name:tx('Hududlar','Районы','Districts'),value:'3',icon:MapPinned,trend:'Demo'},{name:tx('Kanal uchastkalari','Участки каналов','Canal sections'),value:'8',icon:Waves,trend:'+2'},{name:tx('Kuzatuvlar','Наблюдения','Observations'),value:'12',icon:Gauge,trend:'+3'},{name:STR.alert,value:'4',icon:Bell,trend:'Demo'}],series:[29,39,34,48,44,54,51,63,61,70,66,75]},
  {id:'admin',icon:ShieldCheck,label:tx('Administrator','Администратор','Administrator'),headline:tx('Tizim ko‘rinishi','Обзор системы','System overview'),sub:tx('Tizim va qurilmalar uchun namoyish paneli','Демонстрационный экран системы','System and device interface preview'),stats:[{name:tx('Demo qurilmalar','Демо-устройства','Demo devices'),value:'6',icon:RadioTower,trend:'Demo'},{name:tx('Foydalanuvchi rollari','Роли пользователей','User roles'),value:'4',icon:ShieldCheck,trend:'Demo'},{name:tx('Sinov yozuvlar','Тестовые записи','Sample records'),value:'12',icon:ClipboardList,trend:'+3'},{name:STR.alert,value:'3',icon:Bell,trend:'Demo'}],series:[26,32,38,40,35,49,44,55,52,57,60,65]},
];
const sections:{id:Section;label:T;icon:LucideIcon}[]=[
  {id:'overview',label:STR.title,icon:LayoutDashboard},
  {id:'map',label:tx('Xarita va maydonlar','Карта и поля','Maps and fields'),icon:MapPinned},
  {id:'water',label:tx('Suv monitoringi','Мониторинг воды','Water monitoring'),icon:Droplets},
  {id:'devices',label:tx('Qurilmalar','Устройства','Devices'),icon:RadioTower},
  {id:'analytics',label:tx('Tahlillar','Аналитика','Analytics'),icon:BarChart3},
  {id:'reports',label:tx('Hisobotlar','Отчёты','Reports'),icon:FileBarChart},
  {id:'alerts',label:STR.alert,icon:Bell},
  {id:'advice',label:tx('Tavsiyalar','Рекомендации','Advice'),icon:Sprout},
  {id:'settings',label:tx('Sozlamalar','Настройки','Settings'),icon:Settings},
];
const records=[
 {id:'001',field:tx('1-maydon · Paxta','Поле 1 · Хлопок','Field 1 · Cotton'),type:tx('Sug‘orish','Орошение','Irrigation'),volume:'520 m³',status:tx('Bajarildi','Завершено','Completed'),good:true,date:'12.10.2026'},
 {id:'002',field:tx('2-maydon · Bug‘doy','Поле 2 · Пшеница','Field 2 · Wheat'),type:tx('Oqim o‘lchovi','Измерение расхода','Flow reading'),volume:'240 l/s',status:tx('Namuna','Демо','Sample'),good:false,date:'13.10.2026'},
 {id:'003',field:tx('3-maydon · Sabzavot','Поле 3 · Овощи','Field 3 · Vegetables'),type:tx('Monitoring','Мониторинг','Monitoring'),volume:'—',status:tx('Rejada','В планах','Planned'),good:false,date:'14.10.2026'},
 {id:'004',field:tx('1-kanal · Buxoro','Канал 1 · Бухара','Canal 1 · Bukhara'),type:tx('Kanal tekshiruvi','Проверка канала','Canal check'),volume:'410 m³',status:tx('Bajarildi','Завершено','Completed'),good:true,date:'15.10.2026'},
 {id:'005',field:tx('Sensor · Demo','Датчик · Демо','Sensor · Demo'),type:tx('Signal namunasi','Пример сигнала','Sample signal'),volume:'—',status:tx('Namuna','Демо','Sample'),good:false,date:'16.10.2026'},
];
const alerts=[
 {icon:Droplets,level:'warning',title:tx('Suv oqimi o‘zgargan','Изменение расхода воды','Water flow changed'),detail:tx('Bu namunaviy holat; jonli sensor ulanmagan.','Это пример; датчик не подключён.','Illustrative event; no live sensor connected.'),time:tx('Namuna · 10 daqiqa','Пример · 10 минут','Sample · 10 min')},
 {icon:Wifi,level:'info',title:tx('Signal holati','Состояние сигнала','Signal status'),detail:tx('Qurilma signali — konsept ekran.','Сигнал устройства — экран концепта.','Device signal is a concept preview.'),time:tx('Namuna · 34 daqiqa','Пример · 34 минуты','Sample · 34 min')},
 {icon:CheckCircle2,level:'good',title:tx('Hisobot namunasi tayyor','Пример отчёта готов','Sample report ready'),detail:tx('Hisobot demo qiymatlardan yaratilgan.','Отчёт создан из демонстрационных данных.','Report built from sample values.'),time:tx('Namuna · 1 soat','Пример · 1 час','Sample · 1 hour')},
 {icon:Thermometer,level:'danger',title:tx('Tuproq namligi kamaygan','Снижение влажности почвы','Low soil moisture'),detail:tx('Bu real maydonning o‘lchovi emas.','Это не измерение реального поля.','Not a real field measurement.'),time:tx('Namuna · 2 soat','Пример · 2 часа','Sample · 2 hours')},
];
function csvCell(value:string){return '"'+value.replace(/"/g,'""')+'"';}

export default function UnifiedWaterPlatform(){
  const {language}=useLanguage();
  const lang=(language==='ru'||language==='en'?language:'uz') as Lang;
  const t=(value:T)=>value[lang];
  const [role,setRole]=useState<Role>('farmer');
  const [section,setSection]=useState<Section>('overview');
  const [period,setPeriod]=useState<Period>('year');
  const [signal,setSignal]=useState<Signal>('flow');
  const [selectedPoint,setSelectedPoint]=useState(0);
  const [openAlert,setOpenAlert]=useState<number|null>(null);
  const [search,setSearch]=useState('');
  const [mobileNav,setMobileNav]=useState(false);
  const current=roleData.find(r=>r.id===role)!;
  const activeSection=sections.find(s=>s.id===section)!;
  const filteredRecords=useMemo(()=>records.filter(item=>[item.id,t(item.field),t(item.type),t(item.status),item.date].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),[search,lang]);
  const fullSeries=current.series;
  const series=period==='year'?fullSeries:period==='month'?fullSeries.slice(8):fullSeries.slice(5);
  const labels=period==='year'?['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']:period==='month'?['1','2','3','4']:['1','2','3','4','5','6','7'];
  const vals=signal==='flow'?series:signal==='humidity'?series.map((n,i)=>Math.min(95,Math.max(18,n+6-(i%3)*12))):series.map((n,i)=>Math.round(n*.32+(i%4)*5));
  const xx=(index:number,total:number)=>44+index*550/Math.max(1,total-1);
  const yy=(value:number)=>224-value*1.75;
  const points=vals.map((v,i)=>`${xx(i,vals.length).toFixed(2)},${yy(v).toFixed(2)}`).join(' ');
  const secondPoints=vals.map((v,i)=>`${xx(i,vals.length).toFixed(2)},${yy(Math.max(8,v*.75+6+(i%3)*2)).toFixed(2)}`).join(' ');
  const signalLabel=signal==='flow'?tx('Suv sarfi','Расход воды','Water flow'):signal==='humidity'?tx('Tuproq namligi','Влажность почвы','Soil moisture'):tx('Yog‘ingarchilik','Осадки','Rainfall');
  function chooseSection(next:Section){setSection(next);setMobileNav(false);}
  function exportCsv(){
    const headers=['ID','Date','Object','Activity','Volume','Status'];
    const rows=filteredRecords.map(item=>[item.id,item.date,t(item.field),t(item.type),item.volume,t(item.status)]);
    const content='\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download='agropulse-demo-records.csv';a.click();URL.revokeObjectURL(url);
  }
  return <section className="ap-dash" aria-label={t(tx('AgroPulse yagona platformasi','Единая платформа AgroPulse','AgroPulse unified platform'))}>
    <div className="ap-dash-ribbon"><ShieldCheck size={16}/>{t(STR.demo)}<span>·</span>{t(STR.summary)}</div>
    <div className="ap-dash-workspace">
      <aside className={'ap-dash-sidebar '+(mobileNav?'is-open':'')} aria-label={t(tx('Boshqaruv menyusi','Меню управления','Dashboard navigation'))}>
        <div className="ap-dash-brand"><span className="ap-dash-brand-icon"><Leaf size={25}/></span><div><strong>Agro<span>Pulse</span></strong><small>WATER SYSTEM · DEMO</small></div></div>
        <div className="ap-dash-sidebar-label">{t(tx('BOSHQARUV','УПРАВЛЕНИЕ','MANAGEMENT'))}</div>
        <nav className="ap-dash-nav">{sections.slice(0,8).map(item=><button type="button" key={item.id} className={section===item.id?'is-active':''} aria-current={section===item.id?'page':undefined} onClick={()=>chooseSection(item.id)}><item.icon size={17}/><span>{t(item.label)}</span>{section===item.id&&<ChevronRight size={14}/>}</button>)}</nav>
        <div className="ap-dash-sidebar-label ap-dash-sidebar-label-secondary">{t(tx('SOZLAMALAR','НАСТРОЙКИ','SETTINGS'))}</div>
        <nav className="ap-dash-nav"><button type="button" className={section==='settings'?'is-active':''} onClick={()=>chooseSection('settings')}><Settings size={17}/>{t(tx('Sozlamalar','Настройки','Settings'))}</button></nav>
        <div className="ap-dash-sidebar-note"><Sprout size={23}/><strong>{t(tx('Suvdan oqilona foydalanish sari','К разумному использованию воды','Smarter water management'))}</strong><span>{t(tx('AgroPulse konsept interfeysi','Концептуальный интерфейс AgroPulse','AgroPulse concept interface'))}</span></div>
        <div className="ap-dash-user"><div className="ap-dash-user-avatar"><Leaf size={18}/></div><div><strong>{t(tx('Demo foydalanuvchi','Демо-пользователь','Demo user'))}</strong><span>{t(current.label)}</span></div><ChevronDown size={15}/></div>
      </aside>
      <div className="ap-dash-main">
        <div className="ap-dash-toolbar">
          <div className="ap-dash-toolbar-title"><button type="button" aria-label={t(tx('Menyuni ochish','Открыть меню','Open menu'))} className="ap-dash-menu-toggle" onClick={()=>setMobileNav(!mobileNav)}><LayoutDashboard size={18}/></button><div><span className="ap-dash-overline">AGROPULSE / DASHBOARD</span><h3>{section==='overview'?t(STR.title):t(activeSection.label)}</h3><p>{t(current.sub)}</p></div></div>
          <div className="ap-dash-tools"><div className="ap-dash-search"><Search size={15}/><input value={search} onChange={(e:{target:{value:string}})=>setSearch(e.target.value)} placeholder={t(STR.search)} aria-label={t(STR.search)}/>{search&&<button type="button" onClick={()=>setSearch('')} aria-label={t(tx('Tozalash','Очистить','Clear'))}><X size={13}/></button>}</div><label className="ap-dash-period"><CalendarDays size={16}/><span className="ap-dash-sr">{t(tx('Davr','Период','Period'))}</span><select value={period} onChange={(e:{target:{value:string}})=>setPeriod(e.target.value as Period)}><option value="week">{t(tx('7 kun','7 дней','7 days'))}</option><option value="month">{t(tx('Bu oy','Этот месяц','This month'))}</option><option value="year">{t(tx('Bu yil','Этот год','This year'))}</option></select><ChevronDown size={13}/></label><button type="button" className="ap-dash-bell" onClick={()=>chooseSection('alerts')} aria-label={t(STR.alert)}><Bell size={19}/><i/></button></div>
        </div>
        <div className="ap-dash-rolebar"><div><strong>{t(tx('Ko‘rinish turi','Роль для просмотра','Preview as'))}</strong><span>{t(STR.roleDesc)}</span></div><div className="ap-dash-roles" role="group" aria-label={t(STR.selectRole)}>{roleData.map(item=><button type="button" key={item.id} aria-pressed={role===item.id} className={role===item.id?'is-active':''} onClick={()=>{setRole(item.id);setSelectedPoint(0)}}><item.icon size={15}/>{t(item.label)}</button>)}</div></div>
        <div className="ap-dash-statgrid">{current.stats.map((metric,i)=><article key={i} className="ap-dash-stat"><div className="ap-dash-stat-head"><span className={'ap-dash-stat-icon shade-'+i}><metric.icon size={21}/></span><span>{t(metric.name)}</span></div><strong>{metric.value}</strong><div className="ap-dash-stat-foot"><span className={metric.down?'is-down':''}>{metric.down?<ArrowDownRight size={13}/>:<ArrowUpRight size={13}/>} {metric.trend}</span><small>{t(tx('Namuna ko‘rsatkich','Демо показатель','Illustrative indicator'))}</small></div></article>)}</div>
        {(section==='overview'||section==='analytics'||section==='water'||section==='map')&&<div className="ap-dash-visualgrid">
          {(section==='overview'||section==='analytics'||section==='water')&&<article className="ap-dash-panel ap-dash-chart-card"><div className="ap-dash-panel-heading"><div><BarChart3 size={18}/><strong>{t(STR.chart)}</strong></div><span className="ap-dash-label">{t(STR.developed)}</span></div><div className="ap-dash-chart-switch" role="group" aria-label={t(tx('Grafik turi','Тип графика','Chart metric'))}>{([{id:'flow',label:tx('Suv sarfi','Расход воды','Water flow')},{id:'rain',label:tx('Yog‘ingarchilik','Осадки','Rainfall')},{id:'humidity',label:tx('Tuproq namligi','Влажность почвы','Soil moisture')} ] as const).map(item=><button key={item.id} type="button" aria-pressed={signal===item.id} className={signal===item.id?'is-active':''} onClick={()=>setSignal(item.id)}>{t(item.label)}</button>)}</div><div className="ap-dash-chart-legend"><span><i className="ap-dash-dot-primary"/>{t(signalLabel)}</span><span><i className="ap-dash-dot-secondary"/>{t(tx('Taqqoslash (demo)','Сравнение (демо)','Comparison (demo)'))}</span></div><svg className="ap-dash-chart-svg" viewBox="0 0 640 265" preserveAspectRatio="none" role="img" aria-label={`${t(signalLabel)} — ${t(STR.demo)}`}><defs><linearGradient id="apdash-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9be881" stopOpacity=".28"/><stop offset="1" stopColor="#9be881" stopOpacity="0"/></linearGradient></defs>{[50,100,150,200].map((y,i)=><g key={y}><line x1="44" y1={y} x2="601" y2={y} stroke="#6c9aa5" strokeOpacity=".25" strokeDasharray="5 7"/><text x="7" y={y+4} fill="#a9c7d4" fontSize="11">{80-i*20}</text></g>)}<polygon points={`44,227 ${points} 594,227`} fill="url(#apdash-fill)"/><polyline fill="none" stroke="#47baf5" strokeDasharray="6 5" strokeWidth="2.4" points={secondPoints}/><polyline fill="none" stroke="#adf27f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" points={points}/>{vals.map((v,i)=><circle key={i} cx={xx(i,vals.length)} cy={yy(v)} r="4" stroke="#10394a" strokeWidth="2" fill="#bcfa86" aria-label={`${labels[i]} ${v} demo`}/>)}{labels.map((m,i)=><text key={`${m}-${i}`} x={xx(i,vals.length)} y="254" textAnchor="middle" fontSize="11" fill="#a9c7d4">{m}</text>)}</svg><p className="ap-dash-disclaimer">{t(STR.summary)}</p></article>}
          {(section==='overview'||section==='map')&&<article className="ap-dash-panel ap-dash-map-card"><div className="ap-dash-panel-heading"><div><MapPinned size={19}/><strong>{t(STR.map)}</strong></div><span className="ap-dash-label">{t(tx('Konsept','Концепт','Concept'))}</span></div><div className="ap-dash-map"><svg viewBox="0 0 390 300" preserveAspectRatio="none" aria-hidden="true"><polygon points="47,45 157,26 176,105 68,126" fill="#42d7a142" stroke="#86edab" strokeWidth="2"/><polygon points="210,51 341,41 350,130 233,155" fill="#58b5fa42" stroke="#84d8ff" strokeWidth="2"/><polygon points="110,175 237,161 254,269 105,277" fill="#a6e22e3a" stroke="#bbec78" strokeWidth="2"/><path d="M-15 217 C107 173 154 241 250 141 S370 141 405 67" fill="none" stroke="#0a4975" strokeWidth="12"/><path d="M-15 217 C107 173 154 241 250 141 S370 141 405 67" fill="none" stroke="#51cbeb" strokeWidth="5" strokeDasharray="10 8"/></svg>{[0,1,2].map(i=><button type="button" key={i} className={`ap-dash-map-pin pin-${i}${i===selectedPoint?' is-active':''}`} aria-pressed={selectedPoint===i} aria-label={`${t(tx('Namuna nuqta','Тестовая точка','Sample point'))} ${i+1}`} onClick={()=>setSelectedPoint(i)}><Droplets size={17}/></button>)}<div className="ap-dash-map-label"><strong>{t(tx('Maydon','Поле','Field'))} {selectedPoint+1}</strong><span>{t(tx('Sxematik joylashuv','Схематичное расположение','Schematic location'))}</span></div></div><p className="ap-dash-disclaimer">{t(tx('Haqiqiy geografik koordinatalar emas.','Не реальные географические координаты.','Not real geographic coordinates.'))}</p></article>}
          {section==='overview'&&<article className="ap-dash-panel ap-dash-alert-card"><div className="ap-dash-panel-heading"><div><Bell size={18}/><strong>{t(STR.activity)}</strong></div><button type="button" className="ap-dash-link" onClick={()=>chooseSection('alerts')}>{t(tx('Barchasi','Все','View all'))} <ArrowRight size={13}/></button></div><div className="ap-dash-alerts-list">{alerts.map((item,i)=><button key={i} type="button" className={'ap-dash-feed-row level-'+item.level} onClick={()=>setOpenAlert(openAlert===i?null:i)} aria-expanded={openAlert===i}><span className="ap-dash-feed-icon"><item.icon size={18}/></span><span><strong>{t(item.title)}</strong><small>{openAlert===i?t(item.detail):t(item.time)}</small></span></button>)}</div></article>}
        </div>}
        {section==='devices'&&<div className="ap-dash-panel ap-dash-device-section"><div className="ap-dash-panel-heading"><div><RadioTower size={18}/><strong>{t(tx('Qurilmalar holati','Состояние устройств','Device status'))}</strong></div><span className="ap-dash-label">{t(STR.planned)}</span></div>{[[RadioTower,tx('Radarli o‘lchov','Радарное измерение','Radar measurement')],[Wifi,tx('GSM / 4G aloqa','Связь GSM / 4G','GSM / 4G connectivity')],[Gauge,tx('Quyosh quvvati','Солнечное питание','Solar power')]].map(([Icon,label],i)=>{const ItemIcon=Icon as LucideIcon;return <div className="ap-dash-device-row" key={i}><ItemIcon size={20}/><strong>{t(label as T)}</strong><span>{t(tx('Ishlab chiqilmoqda · Konsept','В разработке · Концепт','In development · Concept'))}</span></div>})}</div>}
        {section==='alerts'&&<div className="ap-dash-panel ap-dash-alerts-expanded"><div className="ap-dash-panel-heading"><div><Bell size={18}/><strong>{t(STR.alert)}</strong></div><span className="ap-dash-label">DEMO</span></div>{alerts.map((item,i)=><button type="button" className={'ap-dash-feed-row level-'+item.level} key={i} onClick={()=>setOpenAlert(openAlert===i?null:i)} aria-expanded={openAlert===i}><span className="ap-dash-feed-icon"><item.icon size={18}/></span><span><strong>{t(item.title)}</strong><small>{openAlert===i?t(item.detail):t(item.time)}</small></span><ChevronDown size={15}/></button>)}</div>}
        {section==='advice'&&<div className="ap-dash-panel ap-dash-advice-section"><div className="ap-dash-panel-heading"><div><Sprout size={18}/><strong>{t(tx('AI tavsiyalari','Рекомендации ИИ','AI recommendations'))}</strong></div><span className="ap-dash-label">{t(STR.planned)}</span></div><p className="ap-dash-settings-note">{t(tx('Suv, tuproq, ob-havo va ekinlar bo‘yicha tavsiyalar keyingi bosqichda API orqali ulanadi. Ushbu ekran tavsiyalar qanday ko‘rinishini namoyish etadi, haqiqiy agronomik tavsiya bermaydi.','Рекомендации по воде, почве, погоде и культурам будут подключены через API на следующем этапе. Этот экран — концепт, а не реальная агрономическая рекомендация.','Recommendations based on water, soil, weather and crop data are planned for future API integration. This screen is a visual concept, not real agronomic advice.'))}</p><div className="ap-dash-device-row"><Droplets size={20}/><strong>{t(tx('Suv ma’lumotlari','Данные о воде','Water data'))}</strong><span>{t(STR.planned)}</span></div><div className="ap-dash-device-row"><Sprout size={20}/><strong>{t(tx('Ekin va tuproq ma’lumotlari','Данные о посевах и почве','Crop & soil data'))}</strong><span>{t(STR.planned)}</span></div></div>}
        {section==='settings'&&<div className="ap-dash-panel ap-dash-device-section"><div className="ap-dash-panel-heading"><div><Settings size={18}/><strong>{t(tx('Sozlamalar','Настройки','Settings'))}</strong></div><span className="ap-dash-label">DEMO</span></div><p className="ap-dash-settings-note">{t(tx('Haqiqiy akkaunt va rol sozlamalari API ulangach ochiladi. Hozir faqat demo rol va ko‘rinishni o‘zgartirish mumkin.','Настройки аккаунта станут доступны после подключения API. Здесь доступны только демонстрационные роли.','Account settings will be available when the API is connected. Only demo role previews are available now.'))}</p></div>}
        {(section==='overview'||section==='reports'||section==='map'||section==='water'||section==='analytics')&&<div className="ap-dash-lowergrid"><article className="ap-dash-panel ap-dash-records"><div className="ap-dash-panel-heading"><div><ClipboardList size={18}/><strong>{t(STR.table)}</strong></div><button className="ap-dash-export" type="button" onClick={exportCsv}><Download size={14}/>{t(STR.export)}</button></div><div className="ap-dash-table-wrap"><table><thead><tr><th>#</th><th>{t(tx('Sana','Дата','Date'))}</th><th>{t(tx('Obyekt','Объект','Object'))}</th><th>{t(tx('Faoliyat','Действие','Activity'))}</th><th>{t(tx('Hajm','Объём','Volume'))}</th><th>{t(tx('Holat','Статус','Status'))}</th></tr></thead><tbody>{filteredRecords.length?filteredRecords.map(item=><tr key={item.id}><td>{item.id}</td><td>{item.date}</td><td>{t(item.field)}</td><td>{t(item.type)}</td><td>{item.volume}</td><td><span className={'ap-dash-record-status '+(item.good?'good':'neutral')}>{t(item.status)}</span></td></tr>):<tr><td colSpan={6}>{t(STR.noResults)}</td></tr>}</tbody></table></div></article><article className="ap-dash-panel ap-dash-next"><div className="ap-dash-panel-heading"><div><Activity size={18}/><strong>{t(tx('Platforma holati','Состояние платформы','Platform status'))}</strong></div></div><div className="ap-dash-donut" aria-label={t(STR.demo)}><div><strong>DEMO</strong><small>100%</small></div></div><div className="ap-dash-status-rows"><span><i className="green"/>{t(STR.developed)}</span><span><i className="blue"/>{t(STR.planned)}</span><span><i className="amber"/>{t(tx('API kutilmoqda','Ожидается API','API pending'))}</span></div></article></div>}
        <p className="ap-dash-footer"><ShieldCheck size={16}/>{t(STR.summary)} {t(tx('Rollar faqat demo; haqiqiy kirish huquqlari backend orqali tekshiriladi.','Роли только для демонстрации; реальные права проверяются сервером.','Roles are for preview only; real access rights must be checked by the backend.'))}</p>
      </div>
    </div>
  </section>;
}
