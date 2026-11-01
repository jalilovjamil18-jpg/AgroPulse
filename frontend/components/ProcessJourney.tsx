'use client';
import { useLanguage } from '@/components/LanguageProvider';
import T from '@/components/T';

import {useEffect, useRef, useState} from 'react';
import {ArrowRight, BarChart3, CloudUpload, Droplets, Smartphone, RadioTower} from 'lucide-react';

type Step={number:string;title:string;detail:string;status:string;photo:string;short:string;Icon:typeof Droplets};
const steps:Step[]=[
 {number:'01',title:'Suvni o‘lchang',short:'Kanal',detail:'Kanal ustidagi kontaktsiz radar qurilmasi orqali suv harakatini kuzatish yondashuvi ishlab chiqilmoqda.',status:'Ishlab chiqilmoqda',photo:'/images/company/canal-concept.webp',Icon:Droplets},
 {number:'02',title:'Ma’lumotni uzating',short:'GSM / 4G',detail:'Dala qurilmasi yig‘gan o‘lchovlarni aloqa tarmog‘i orqali platformaga uzatish rejalashtirilgan.',status:'Ishlab chiqilmoqda',photo:'/images/company/irrigation-field.webp',Icon:RadioTower},
 {number:'03',title:'Tahlil qiling',short:'Platforma',detail:'Kanal, hudud va suv ko‘rsatkichlarini birlashtirilgan raqamli interfeysda ko‘rib chiqing. Hozircha namuna qiymatlar ishlatiladi.',status:'Ishlab chiqilgan (demo)',photo:'/images/company/fields.webp',Icon:BarChart3},
 {number:'04',title:'Qaror qabul qiling',short:'Tavsiya',detail:'Ob-havo, tuproq va ekin bilan bog‘liq aqlli sug‘orish tavsiyalari — keyingi rivojlanish rejasi.',status:'Reja',photo:'/images/company/farmer.webp',Icon:Smartphone},
];
export default function ProcessJourney(){
  const {t:__tr}=useLanguage();

 const [active,setActive]=useState(0);
 const refs=useRef<Array<HTMLElement|null>>([]);
 useEffect(()=>{
  if(typeof IntersectionObserver==='undefined')return;
  const observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
   if(visible[0])setActive(Number((visible[0].target as HTMLElement).dataset.journeyIndex||0));
  },{rootMargin:'-22% 0px -37% 0px',threshold:[0,.2,.5]});
  refs.current.forEach(el=>{if(el)observer.observe(el)});
  return()=>observer.disconnect();
 },[]);
 const selected=steps[active];const SelectedIcon=selected.Icon;
 function go(i:number){setActive(i);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;refs.current[i]?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});}
 return <div className="aw110-journey" aria-label={__tr("Suv ma’lumotlari yo‘li")}>
   <div className="aw110-journey-scene">
    <div className="aw110-journey-scene-frame">
     {steps.map((step,index)=><div key={step.number} className={'aw110-journey-background '+(index===active?'is-active':'')} style={{backgroundImage:`linear-gradient(180deg,rgba(5,22,39,.19),rgba(3,18,34,.88)),url('${step.photo}')`}} aria-hidden="true"/>)}
     <div className="aw110-journey-overlay">
      <span className="aw110-journey-overline"><T text={"AGROPULSE / SUV MA’LUMOTLARI YO‘LI"} /></span>
      <div className="aw110-journey-pulse" aria-hidden="true">
       {[Droplets,RadioTower,CloudUpload,Smartphone].map((Icon,i)=><div className={'aw110-pulse-item '+(i<=active?'is-lit':'')} key={i}><Icon size={18}/></div>)}
       <span className="aw110-pulse-beam" style={{width:`${active/3*100}%`}}/>
      </div>
      <span className="aw110-journey-fraction">{selected.number} <span>/ 04</span></span>
      <div className="aw110-journey-head"><span className="aw110-journey-icon"><SelectedIcon size={29}/></span><div><small>{__tr(selected.status)}</small><h3>{__tr(selected.title)}</h3></div></div>
      <p>{__tr(selected.detail)}</p>
      <span className="aw110-journey-honesty"><T text={"Kadr va grafiklar — konsept / demo; jonli sensor ma’lumotlari emas."} /></span>
     </div>
    </div>
    <div className="aw110-journey-tabs" role="group" aria-label={__tr("Jarayon bosqichini tanlang")}>{steps.map((s,i)=><button key={s.number} type="button" aria-pressed={active===i} onClick={()=>go(i)}><b>{s.number}</b><span>{__tr(s.short)}</span></button>)}</div>
   </div>
   <div className="aw110-journey-list">{steps.map((step,i)=><article ref={el=>{refs.current[i]=el}} data-journey-index={i} key={step.number} className={'aw110-journey-step '+(active===i?'is-current':'')}>
    <div className="aw110-journey-step-top"><b>{step.number}</b><span>{__tr(step.status)}</span></div>
    <step.Icon size={30} aria-hidden="true"/>
    <h3>{__tr(step.title)} <ArrowRight size={19}/></h3><p>{__tr(step.detail)}</p>
   </article>)}</div>
 </div>;
}
