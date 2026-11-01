'use client';

import PilotDeviceMonitoring from '@/components/PilotDeviceMonitoring';
import PilotWaterBalance from '@/components/PilotWaterBalance';
import PilotAnnualWaterBalance from '@/components/PilotAnnualWaterBalance';
import {useEffect,useMemo,useState, type FormEvent} from 'react';
import Link from 'next/link';
import {Activity,BarChart3,BookOpenCheck,CheckCircle2,Download,Droplets,Landmark,LayoutDashboard,LockKeyhole,LogOut,MapPinned,RadioTower,RefreshCcw,Search,Shield,ShieldCheck,Sprout,Waves,Plus} from 'lucide-react';
import {useLanguage} from '@/components/LanguageProvider';
import CabinetPeriodAnalytics from '@/components/CabinetPeriodAnalytics';
import {API_BASE,apiRequest,loadPilotData,type PilotData,type Reading,type Role,type Station,type User} from '@/lib/realApi';

type View='overview'|'canals'|'readings'|'fields'|'balance'|'devices';
type Lang='uz'|'ru'|'en';
const text={
 uz:{login:'Tizimga kirish',real:'Haqiqiy ma’lumotlar kabineti',user:'Foydalanuvchi nomi',password:'Parol',submit:'Kirish',logout:'Chiqish',loading:'Ma’lumot yuklanmoqda...',noData:'Hozircha ma’lumot kiritilmagan',error:'API bilan aloqa yo‘q. Backendni tekshiring.',refresh:'Yangilash',role:'Vakolat',overview:'Umumiy holat',canals:'Kanallar',readings:'O‘lchovlar',fields:'Maydonlar',alerts:'Ogohlantirishlar',balance:'Suv balansi',devices:'Qurilmalar',none:'—',site:'Asosiy sayt',summary:'Joriy ko‘rsatkichlar',totalCanals:'Kanallar',totalAreas:'Hududlar',totalFields:'Dalalar',totalStations:'Sensorlar',totalReadings:'O‘lchovlar',totalAlerts:'Ochiq ogohlantirishlar',latest:'So‘nggi o‘lchov',last:'Oxirgi yangilanish',flow:'Oqim (l/s)',time:'O‘lchov vaqti',source:'Manba',status:'Holat',region:'Hudud',name:'Nomi',crop:'Ekin',size:'Maydon (ga)',filter:'Qidirish...',reports:'CSV yuklab olish',manage:'Administrator',demo:'Demo boshqaruv panelini ko‘rish',input:'O‘lchov qo‘shish',station:'Sensor',level:'Suv sathi (sm)',save:'Saqlash',cancel:'Bekor qilish',empty:'Haqiqiy o‘lchovlar hali yo‘q. Tasodifiy sonlar ko‘rsatilmaydi.',helper:'Bu haqiqiy server ma’lumotlari. Sensor ulanmaguncha qiymat bo‘sh turadi.',operator:'Bu ma’lumotni faqat vakolatli irrigatsiya xodimi kiritishi mumkin.',farmer:'Fermer',irrigation:'Irrigatsiya',authority:'Hokimiyat',admin:'Administrator',success:'Ma’lumot bazaga saqlandi',dateInvalid:'Sana va miqdorni tekshiring',scope:'Faqat vakolatingizga tegishli ma’lumotlar ko‘rsatiladi.'},
 ru:{login:'Войти',real:'Кабинет реальных данных',user:'Имя пользователя',password:'Пароль',submit:'Войти',logout:'Выйти',loading:'Загрузка...',noData:'Данные пока не внесены',error:'Нет связи с API. Проверьте сервер.',refresh:'Обновить',role:'Роль',overview:'Обзор',canals:'Каналы',readings:'Измерения',fields:'Поля',alerts:'Оповещения',balance:'Водный баланс',devices:'Устройства',none:'—',site:'На главную',summary:'Текущие показатели',totalCanals:'Каналы',totalAreas:'Зоны',totalFields:'Поля',totalStations:'Датчики',totalReadings:'Измерения',totalAlerts:'Открытые оповещения',latest:'Последнее измерение',last:'Обновлено',flow:'Расход (л/с)',time:'Время измерения',source:'Источник',status:'Состояние',region:'Район',name:'Название',crop:'Культура',size:'Площадь (га)',filter:'Поиск...',reports:'Экспорт CSV',manage:'Администратор',demo:'Демо-панель',input:'Добавить измерение',station:'Датчик',level:'Уровень воды (см)',save:'Сохранить',cancel:'Отмена',empty:'Реальных измерений пока нет. Вымышленные значения не показаны.',helper:'Данные с настоящего сервера. Без датчиков значения остаются пустыми.',operator:'Ввод доступен только уполномоченным операторам.',farmer:'Фермер',irrigation:'Ирригация',authority:'Администрация',admin:'Администратор',success:'Данные сохранены',dateInvalid:'Проверьте время и число',scope:'Доступ только к данным в рамках вашей роли.'},
 en:{login:'Sign in',real:'Live data workspace',user:'Username',password:'Password',submit:'Sign in',logout:'Sign out',loading:'Loading...',noData:'No records have been added',error:'API connection unavailable. Check the backend.',refresh:'Refresh',role:'Role',overview:'Overview',canals:'Canals',readings:'Readings',fields:'Fields',alerts:'Alerts',balance:'Water balance',devices:'Devices',none:'—',site:'Public website',summary:'Current metrics',totalCanals:'Canals',totalAreas:'Zones',totalFields:'Fields',totalStations:'Sensors',totalReadings:'Readings',totalAlerts:'Open alerts',latest:'Latest reading',last:'Last updated',flow:'Flow (l/s)',time:'Recorded at',source:'Source',status:'Status',region:'District',name:'Name',crop:'Crop',size:'Area (ha)',filter:'Search...',reports:'Download CSV',manage:'Administrator',demo:'View demo dashboard',input:'Add reading',station:'Station',level:'Water level (cm)',save:'Save',cancel:'Cancel',empty:'No measured readings yet. No fictitious values are displayed.',helper:'These are genuine server records. Values remain empty until readings are added.',operator:'Only authorized irrigation operators can record measurements.',farmer:'Farmer',irrigation:'Irrigation',authority:'Local authority',admin:'Administrator',success:'Reading stored',dateInvalid:'Check date and quantity',scope:'Only data within your role and assigned scope are shown.'}
};
const tokens={farmer:Sprout,irrigation:Waves,authority:Landmark,admin:Shield};
function dt(value:string|null|undefined,lang:Lang){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString(lang==='uz'?'uz-UZ':lang==='ru'?'ru-RU':'en-GB',{dateStyle:'medium',timeStyle:'short'});}
function valueOrDash(value:unknown){return value===null||value===undefined||value===''?'—':String(value)}
export default function RealPilotCabinet(){
 const {language}=useLanguage();const lang=(language==='ru'||language==='en'?language:'uz') as Lang;const L=text[lang];
 const [token,setToken]=useState('');const [user,setUser]=useState<User|null>(null);const [data,setData]=useState<PilotData|null>(null);
 const [authLoading,setAuthLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [view,setView]=useState<View>('overview');const [query,setQuery]=useState('');const [refreshKey,setRefreshKey]=useState(0);
 const [adding,setAdding]=useState(false);const [ok,setOk]=useState('');const [stationId,setStationId]=useState('');const [at,setAt]=useState('');const [flow,setFlow]=useState('');const [level,setLevel]=useState('');
 async function refresh(currentToken:string){const result=await loadPilotData(currentToken);setData(result);setUser(result.summary.user);setRefreshKey(v=>v+1);}
 useEffect(()=>{const stored=sessionStorage.getItem('agropulse_api_token');if(!stored){setAuthLoading(false);return;}
  let alive=true;
  loadPilotData(stored).then(result=>{if(!alive)return;setToken(stored);setUser(result.summary.user);setData(result);}).catch(()=>{if(!alive)return;sessionStorage.removeItem('agropulse_api_token');setError('Session tugagan yoki API ulanmagan.');}).finally(()=>{if(alive)setAuthLoading(false)});
  return()=>{alive=false};
 },[]);
 async function signIn(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');setOk('');const fd=new FormData(event.currentTarget);
 try{const result=await apiRequest<{token:string;user:User}>('/auth/login/',undefined,{method:'POST',body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})});
 sessionStorage.setItem('agropulse_api_token',result.token);setToken(result.token);setUser(result.user);await refresh(result.token);
 }catch(err){setError(err instanceof Error?err.message:L.error)}finally{setBusy(false)}}
 async function signOut(){try{await apiRequest('/auth/logout/',token,{method:'POST'})}catch{}sessionStorage.removeItem('agropulse_api_token');setToken('');setUser(null);setData(null);setView('overview');}
 async function reload(){setBusy(true);setError('');try{await refresh(token)}catch(err){setError(err instanceof Error?err.message:L.error)}finally{setBusy(false)}}
 async function exportCsv(){setBusy(true);setError('');try{const res=await fetch(API_BASE+'/reports/readings.csv',{headers:{Authorization:`Token ${token}`}});if(!res.ok)throw Error('CSV '+res.status);const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='agropulse_readings.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}catch(err){setError(err instanceof Error?err.message:L.error)}finally{setBusy(false)}}
 async function saveReading(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');setOk('');if(!stationId||!at||flow===''){setError(L.dateInvalid);setBusy(false);return}
 try{await apiRequest('/readings/',token,{method:'POST',body:JSON.stringify({station_id:Number(stationId),recorded_at:new Date(at).toISOString(),flow_lps:flow,...(level!==''?{level_cm:level}:{})})});setOk(L.success);setAdding(false);setFlow('');setLevel('');await refresh(token)}catch(err){setError(err instanceof Error?err.message:L.error)}finally{setBusy(false)}}
 const filtered=useMemo(()=>{if(!data)return [];const rows=data.readings;if(!query.trim())return rows;return rows.filter(r=>(r.station_code+' '+r.recorded_at+' '+r.flow_lps).toLowerCase().includes(query.toLowerCase()))},[data,query]);
 const role=user?.role||'farmer';const Icon=tokens[role];const available:(View)[]=role==='farmer'?['overview','fields','readings']:role==='authority'||role==='admin'?['overview','balance','devices','canals','fields','readings']:['overview','devices','canals','fields','readings'];
 const roleDesc=role==='farmer'?(lang==='uz'?'Dalalaringiz va o‘lchovlaringiz':lang==='ru'?'Ваши поля и измерения':'Your fields and readings'):role==='irrigation'?(lang==='uz'?'Biriktirilgan kanallar va o‘lchovlar':lang==='ru'?'Закреплённые каналы и измерения':'Assigned canals and measurements'):role==='authority'?(lang==='uz'?'Qorako‘l hududiy ko‘rsatkichlari':lang==='ru'?'Показатели Каракульского района':'Qorako‘l district overview'):L.manage;
 const kpis=data?[
 {icon:Waves,label:L.totalCanals,value:data.summary.counts.canals},
 {icon:MapPinned,label:role==='farmer'?L.totalFields:L.totalAreas,value:role==='farmer'?data.summary.counts.fields:data.summary.counts.areas},
 {icon:RadioTower,label:L.totalStations,value:data.summary.counts.stations},
 {icon:BarChart3,label:L.totalReadings,value:data.summary.counts.readings}
 ]:[];
 return <div className="ap-real-wrap">
 {authLoading?<div className="ap-real-auth"><Activity size={32}/><p>{L.loading}</p></div>:!token||!user||!data?
 <section className="ap-real-auth" aria-label={L.login}><div className="ap-real-auth-logo"><Droplets size={28}/><span>Agro<span>Pulse</span></span></div><span className="ap-real-pill"><LockKeyhole size={15}/> QORAKO‘L PILOT · REAL API</span><h1>{L.login}</h1><p>{L.real}</p><form onSubmit={signIn}><label>{L.user}<input name="username" autoComplete="username" required minLength={1}/></label><label>{L.password}<input type="password" name="password" autoComplete="current-password" required/></label><button className="ap-real-primary" type="submit" disabled={busy}>{busy?L.loading:L.submit}</button></form>{error&&<div className="ap-real-message error" role="alert">{error}</div>}<Link href="/">← {L.site}</Link><small>{L.helper}</small></section>
 :<div className="ap-real-app">
  <aside className="ap-real-sidebar"><div className="ap-real-auth-logo"><Droplets size={25}/><span>Agro<span>Pulse</span></span></div><span className="ap-real-pill"><ShieldCheck size={14}/> QORAKO‘L · REAL</span>
    <nav aria-label="Dashboard">{available.map(id=>{const navIcons={overview:LayoutDashboard,canals:Waves,fields:Sprout,readings:BarChart3,balance:BookOpenCheck,devices:RadioTower};const Item=navIcons[id];return <button type="button" key={id} className={view===id?'selected':''} onClick={()=>setView(id)}><Item size={18}/>{L[id]}</button>})}</nav>
    <div className="ap-real-sidebar-bottom"><small>{L.scope}</small><Link href="/">← {L.site}</Link><button type="button" onClick={signOut}><LogOut size={17}/> {L.logout}</button></div>
  </aside>
  <div className="ap-real-main"><div className="ap-real-top"><div><span className="ap-real-kicker">AGROPULSE / QORAKO‘L / {L.real}</span><h1><Icon size={27}/>{L[role]}</h1><p>{roleDesc}</p></div><div className="ap-real-top-actions"><button type="button" onClick={reload} disabled={busy}><RefreshCcw size={17}/>{L.refresh}</button><span className="ap-real-user"><ShieldCheck size={16}/>{user.full_name}</span></div></div>
  {error&&<div className="ap-real-message error" role="alert">{error}</div>}{ok&&<div className="ap-real-message good" role="status">{ok}</div>}
  <div className="ap-real-status"><CheckCircle2 size={18}/>{L.helper}<span>{L.role}: {L[role]}</span></div>
  <div className="ap-real-mobile-nav">{available.map(id=><button className={view===id?'selected':''} key={id} onClick={()=>setView(id)}>{L[id]}</button>)}</div>
  {view==='overview'&&<>
  <CabinetPeriodAnalytics token={token}/>
  <div className="ap-real-stats">{kpis.map(k=>{const K=k.icon;return <article key={k.label}><K size={23}/><small>{k.label}</small><strong>{k.value}</strong><span>{L.region}: {user.district?.name||'—'}</span></article>})}</div>
  <section className="ap-real-panel ap-cabinet-note">
    <h2><ShieldCheck size={20}/>{L.summary}</h2>
    <p>{lang==='uz'?'Kabinetda faqat sizning vakolatingiz doirasidagi bazaga yozilgan haqiqiy ma’lumotlar ko‘rsatiladi. O‘lchov mavjud bo‘lmasa, raqam uydirilmaydi.':lang==='ru'?'Кабинет показывает только реальные записи базы в рамках ваших прав. При отсутствии измерений значения не придумываются.':'The cabinet shows only real database records within your permissions. Missing measurements are never fabricated.'}</p>
  </section>
 </>}
 {view==='balance'&&(role==='authority'||role==='admin')&&<><PilotAnnualWaterBalance token={token}/><PilotWaterBalance token={token} refreshKey={refreshKey}/></> }
  {view==='devices'&&role!=='farmer'&&<PilotDeviceMonitoring token={token} role={role} refreshKey={refreshKey}/>}
  {view==='canals'&&<section className="ap-real-panel"><h2><Waves size={21}/>{L.canals}</h2>{!data.canals.length?<p className="ap-real-empty">{L.noData}</p>:<div className="ap-real-simple-grid">{data.canals.map(c=><article key={c.id}><Waves size={20}/><strong>{c.name}</strong><small>{c.code}</small></article>)}</div>}</section>}
  {view==='fields'&&<section className="ap-real-panel"><h2><Sprout size={21}/>{L.fields}</h2>{!data.fields.length?<p className="ap-real-empty">{L.noData}</p>:<div className="ap-real-table-scroll"><table><thead><tr><th>{L.name}</th><th>{L.crop}</th><th>{L.size}</th></tr></thead><tbody>{data.fields.map(f=><tr key={f.id}><td>{f.name}</td><td>{f.crop||'—'}</td><td>{f.area_ha}</td></tr>)}</tbody></table></div>}</section>}
  {view==='readings'&&<section className="ap-real-panel"><div className="ap-real-panel-head"><h2><BarChart3 size={20}/>{L.readings}</h2><div className="ap-real-actions"><button onClick={exportCsv} disabled={busy}><Download size={16}/>{L.reports}</button>{role==='irrigation'||role==='admin'?<button className="ap-real-primary" onClick={()=>setAdding(x=>!x)}><Plus size={16}/>{L.input}</button>:null}</div></div>
   {adding&&<form className="ap-real-entry" onSubmit={saveReading}><label>{L.station}<select required value={stationId} onChange={e=>setStationId(e.target.value)}><option value="">—</option>{data.stations.filter(s=>s.is_enabled).map(s=><option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></label><label>{L.time}<input required type="datetime-local" value={at} onChange={e=>setAt(e.target.value)}/></label><label>{L.flow}<input required min="0" step="0.001" type="number" value={flow} onChange={e=>setFlow(e.target.value)}/></label><label>{L.level}<input min="0" step="0.01" type="number" value={level} onChange={e=>setLevel(e.target.value)}/></label><button className="ap-real-primary" disabled={busy}>{L.save}</button><button type="button" onClick={()=>setAdding(false)}>{L.cancel}</button></form>}
   <label className="ap-real-search"><Search size={17}/><input placeholder={L.filter} value={query} onChange={e=>setQuery(e.target.value)}/></label><ReadingsTable list={filtered} L={L} lang={lang}/></section>}
  
  <div className="ap-real-footer"><ShieldCheck size={16}/> {L.scope}</div>
  </div>
 </div>}
 </div>;
}
function ReadingsTable({list,L,lang}:{list:Reading[];L:typeof text.uz;lang:Lang}){return !list.length?<p className="ap-real-empty">{L.empty}</p>:<div className="ap-real-table-scroll"><table><thead><tr><th>{L.station}</th><th>{L.time}</th><th>{L.flow}</th><th>{L.level}</th><th>{L.source}</th></tr></thead><tbody>{list.map(r=><tr key={r.id}><td>{r.station_code}</td><td>{dt(r.recorded_at,lang)}</td><td>{r.flow_lps}</td><td>{r.level_cm||'—'}</td><td>{r.source}</td></tr>)}</tbody></table></div>}
