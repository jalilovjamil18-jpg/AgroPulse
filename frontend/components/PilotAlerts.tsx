'use client';
import {useState,type FormEvent} from 'react';
import {AlertTriangle,Check,Plus} from 'lucide-react';
import {apiRequest,type Alert,type Canal,type Role} from '@/lib/realApi';
import {useLanguage} from '@/components/LanguageProvider';
const copy={
 uz:{title:'Ogohlantirishlar',empty:'Ogohlantirish yo‘q',new:'Ogohlantirish yaratish',close:'Yopish',cancel:'Bekor qilish',save:'Saqlash',canal:'Kanal',subject:'Sarlavha',description:'Izoh',resolve:'Muammo hal qilindi',status:'Holat',done:'Yopilgan',pending:'Ochiq',info:'Bu xabarlar vakolatli xodim kiritgan haqiqiy ma’lumotlar, avtomatik aniqlangan emas.'},
 ru:{title:'Оповещения',empty:'Нет оповещений',new:'Создать оповещение',close:'Закрыть',cancel:'Отмена',save:'Сохранить',canal:'Канал',subject:'Заголовок',description:'Описание',resolve:'Решено',status:'Статус',done:'Закрыто',pending:'Открыто',info:'Сообщения вносятся уполномоченными людьми, не определяются автоматически.'},
 en:{title:'Alerts',empty:'No alerts',new:'Create alert',close:'Close',cancel:'Cancel',save:'Save',canal:'Canal',subject:'Title',description:'Description',resolve:'Mark resolved',status:'Status',done:'Resolved',pending:'Open',info:'These are operator-entered records, not automatically detected incidents.'}
};
export default function PilotAlerts({items,canals,token,role,onChange}:{items:Alert[];canals:Canal[];token:string;role:Role;onChange:()=>Promise<void>}){
 const {language}=useLanguage();const L=copy[language==='ru'?'ru':language==='en'?'en':'uz'];const canWrite=role==='irrigation'||role==='admin';
 const [open,setOpen]=useState(false);const [canal,setCanal]=useState('');const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [pending,setPending]=useState(false);const [error,setError]=useState('');
 async function create(e:FormEvent){e.preventDefault();setPending(true);setError('');try{await apiRequest('/alerts/new/',token,{method:'POST',body:JSON.stringify({canal_id:Number(canal),title,description})});setOpen(false);setTitle('');setDescription('');await onChange()}catch(err){setError(err instanceof Error?err.message:'API error')}finally{setPending(false)}}
 async function resolve(id:number){setPending(true);setError('');try{await apiRequest(`/alerts/${id}/resolve/`,token,{method:'POST'});await onChange()}catch(err){setError(err instanceof Error?err.message:'API error')}finally{setPending(false)}}
 return <section className="ap-real-panel"><div className="ap-real-panel-head"><h2><AlertTriangle size={20}/>{L.title}</h2>{canWrite&&<button className="ap-real-primary" type="button" onClick={()=>setOpen(v=>!v)}><Plus size={16}/>{L.new}</button>}</div>
 <p className="ap-real-note">{L.info}</p>{error&&<div role="alert" className="ap-real-message error">{error}</div>}
 {canWrite&&open&&<form className="ap-real-entry" onSubmit={create}><label>{L.canal}<select required value={canal} onChange={e=>setCanal(e.target.value)}><option value="">—</option>{canals.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>{L.subject}<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{L.description}<textarea maxLength={5000} value={description} onChange={e=>setDescription(e.target.value)}/></label><button type="submit" className="ap-real-primary" disabled={pending}>{L.save}</button><button type="button" onClick={()=>setOpen(false)}>{L.cancel}</button></form>}
 {!items.length?<p className="ap-real-empty">{L.empty}</p>:<div className="ap-real-alerts">{items.map(a=><article key={a.id}><AlertTriangle size={21}/><div><strong>{a.title}</strong><p>{a.description}</p><small>{new Date(a.created_at).toLocaleString()}</small></div><div className="ap-real-alert-action"><span>{a.status==='resolved'?L.done:L.pending}</span>{canWrite&&a.status==='open'&&a.canal_id!==null&&canals.some(c=>c.id===a.canal_id)&&<button type="button" disabled={pending} onClick={()=>resolve(a.id)}><Check size={14}/>{L.resolve}</button>}</div></article>)}</div>}
 </section>;
}
