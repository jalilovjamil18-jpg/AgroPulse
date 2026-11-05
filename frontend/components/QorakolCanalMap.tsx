'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {ExternalLink,Layers,MapPin,Maximize2,Search,ShieldCheck,ZoomIn,ZoomOut,Waves} from 'lucide-react';
import type {Canal} from '@/lib/realApi';

type Lang='uz'|'ru'|'en';
type YMap3={
 addChild:(child:unknown)=>YMap3;
 setLocation:(location:{center?:[number,number];zoom?:number;duration?:number})=>void;
 destroy:()=>void;
};
type YMaps3={
 ready:Promise<void>;
 YMap:new (container:HTMLElement,options:Record<string,unknown>,children?:unknown[])=>YMap3;
 YMapDefaultSchemeLayer:new (options?:Record<string,unknown>)=>unknown;
 YMapDefaultFeaturesLayer:new (options?:Record<string,unknown>)=>unknown;
 import:{
  (packageName:string):Promise<{YMapDefaultMarker:new (options:Record<string,unknown>)=>unknown}>;
  registerCdn?:(template:string,packageName:string)=>void;
 };
};
type WindowWithYandexMaps = Window & {ymaps3?:YMaps3};

const CENTER:[number,number]=[63.85556,39.50278];

function loadYandexMaps(key:string):Promise<YMaps3>{
 return new Promise((resolve,reject)=>{
  const finish=async()=>{
   try{
    const api=(window as WindowWithYandexMaps).ymaps3;
    if(!api)throw new Error('Yandex Maps API yuklanmadi.');
    await api.ready;
    resolve(api);
   }catch(error){reject(error)}
  };
  if((window as WindowWithYandexMaps).ymaps3){void finish();return;}
  let script=document.querySelector<HTMLScriptElement>('script[data-agropulse-yandex]');
  if(script){
   script.addEventListener('load',()=>{script!.dataset.loaded='true';void finish()},{once:true});
   script.addEventListener('error',()=>reject(new Error('Yandex Maps serveriga ulanib bo‘lmadi.')),{once:true});
   if(script.dataset.loaded==='true')void finish();
   return;
  }
  script=document.createElement('script');
  script.dataset.agropulseYandex='true';
  script.src=`https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(key)}&lang=ru_RU`;
  script.async=true;
  script.onload=()=>{script!.dataset.loaded='true';void finish()};
  script.onerror=()=>reject(new Error('Yandex API kaliti yoki internet aloqasini tekshiring.'));
  document.head.appendChild(script);
 });
}

const words={
 uz:{
  title:'Qorako‘l tumani kanallari xaritasi',
  subtitle:'Interaktiv kanal tarmog‘i va suv taqsimoti reyestri',
  total:'Jami kanallar',
  geometry:'Yo‘nalish geometriyasi',
  waiting:'Backend koordinatalari kutilmoqda',
  channels:'Kanallar ro‘yxati',
  empty:'Hozircha kanallar kiritilmagan',
  hint:'Backend kanal yo‘nalishlarini GeoJSON koordinatalari orqali uzatgach, kanallar xaritada chiziq shaklida ko‘rsatiladi.',
  center:'Qorako‘l tumani markazi',
  loading:'Xarita yuklanmoqda…',
  noKey:'Yandex API kaliti ulanmagan. frontend/.env.local faylidagi NEXT_PUBLIC_YANDEX_MAPS_API_KEY sozlamasini tekshiring.',
  failed:'Xarita yuklanmadi. Yandex API kaliti va internet aloqasini tekshiring.',
  map:'Xarita',
  satellite:'Sputnikni ochish',
  fullscreen:'To‘liq ekran',
  search:'Kanal nomi yoki kodi bo‘yicha qidirish…',
  noMatch:'Mos kanal topilmadi',
  open:'Yandex Maps’da ochish',
  real:'Haqiqiy ma’lumotlar',
  zoomIn:'Kattalashtirish',
  zoomOut:'Kichraytirish'
 },
 ru:{
  title:'Карта каналов Каракульского района',
  subtitle:'Интерактивная сеть каналов и реестр водораспределения',
  total:'Всего каналов',
  geometry:'Геометрия маршрутов',
  waiting:'Ожидаются координаты от backend',
  channels:'Список каналов',
  empty:'Каналы пока не добавлены',
  hint:'После передачи backend координат маршрутов в формате GeoJSON каналы будут отображаться на карте линиями.',
  center:'Центр Каракульского района',
  loading:'Загрузка карты…',
  noKey:'Ключ Yandex API не подключён. Проверьте NEXT_PUBLIC_YANDEX_MAPS_API_KEY в frontend/.env.local.',
  failed:'Не удалось загрузить карту. Проверьте ключ Yandex API и подключение к интернету.',
  map:'Карта',
  satellite:'Открыть спутник',
  fullscreen:'На весь экран',
  search:'Поиск по названию или коду канала…',
  noMatch:'Канал не найден',
  open:'Открыть в Яндекс Картах',
  real:'Реальные данные',
  zoomIn:'Увеличить',
  zoomOut:'Уменьшить'
 },
 en:{
  title:'Qorako‘l district canal map',
  subtitle:'Interactive canal network and water distribution register',
  total:'Total canals',
  geometry:'Route geometry',
  waiting:'Waiting for backend coordinates',
  channels:'Canal register',
  empty:'No canals have been added yet',
  hint:'When the backend provides canal route coordinates as GeoJSON, canal lines will be rendered on this map.',
  center:'Qorako‘l district centre',
  loading:'Loading map…',
  noKey:'Yandex API key is not configured. Check NEXT_PUBLIC_YANDEX_MAPS_API_KEY in frontend/.env.local.',
  failed:'Map failed to load. Check the Yandex API key and internet connection.',
  map:'Map',
  satellite:'Open satellite',
  fullscreen:'Fullscreen',
  search:'Search by canal name or code…',
  noMatch:'No matching canal',
  open:'Open in Yandex Maps',
  real:'Live data',
  zoomIn:'Zoom in',
  zoomOut:'Zoom out'
 }
};

export default function QorakolCanalMap({canals,lang}:{canals:Canal[];lang:Lang}){
 const t=words[lang];
 const mapNode=useRef<HTMLDivElement|null>(null);
 const mapRef=useRef<YMap3|null>(null);
 const zoomRef=useRef(12);
 const [status,setStatus]=useState<'loading'|'ready'|'error'|'missing'>('loading');
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const filtered=useMemo(
  ()=>canals.filter(canal=>(canal.name+' '+canal.code).toLowerCase().includes(query.trim().toLowerCase())),
  [canals,query]
 );

 useEffect(()=>{
  const key=process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if(!key){setStatus('missing');return;}
  let cancelled=false;
  let instance:YMap3|null=null;
  loadYandexMaps(key).then(async api=>{
   if(cancelled||!mapNode.current)return;
   api.import.registerCdn?.('https://cdn.jsdelivr.net/npm/{package}','@yandex/ymaps3-default-ui-theme@0.0');
   const {YMapDefaultMarker}=await api.import('@yandex/ymaps3-default-ui-theme');
   if(cancelled||!mapNode.current)return;
   instance=new api.YMap(mapNode.current,{
    location:{center:CENTER,zoom:zoomRef.current},
    showScaleInCopyrights:true
   },[
    new api.YMapDefaultSchemeLayer({}),
    new api.YMapDefaultFeaturesLayer({})
   ]);
   instance.addChild(new YMapDefaultMarker({
    coordinates:CENTER,
    title:'Qorako‘l tumani',
    subtitle:'Kanal tarmog‘i xaritasi',
    color:'green',
    size:'normal',
    iconName:'fallback'
   }));
   mapRef.current=instance;
   setStatus('ready');
  }).catch(err=>{
   if(!cancelled){
    setError(err instanceof Error?err.message:'');
    setStatus('error');
   }
  });
  return()=>{
   cancelled=true;
   if(instance){
    instance.destroy();
    if(mapRef.current===instance)mapRef.current=null;
   }
  };
 },[]);

 function changeZoom(delta:number){
  zoomRef.current=Math.max(5,Math.min(19,zoomRef.current+delta));
  mapRef.current?.setLocation({center:CENTER,zoom:zoomRef.current,duration:250});
 }
 function fullscreen(){
  const node=mapNode.current?.closest('.ap-qmap-main');
  if(!node)return;
  if(document.fullscreenElement)void document.exitFullscreen();
  else void node.requestFullscreen?.();
 }
 function openSatellite(){
  window.open('https://yandex.uz/maps/?ll=63.85556%2C39.50278&z=14&l=sat%2Cskl','_blank','noopener,noreferrer');
 }

 return <section className="ap-qmap">
  <header className="ap-qmap-head">
   <div>
    <span className="ap-real-kicker">AGROPULSE / QORAKO‘L / {t.real}</span>
    <h2><MapPin size={22}/>{t.title}</h2>
    <p>{t.subtitle}</p>
   </div>
   <div className="ap-qmap-head-actions">
    <span><ShieldCheck size={14}/>{t.real}</span>
    <a href="https://yandex.uz/maps/?ll=63.85556%2C39.50278&z=12" target="_blank" rel="noreferrer">{t.open}<ExternalLink size={14}/></a>
   </div>
  </header>

  <div className="ap-qmap-layout">
   <div className="ap-qmap-main">
    <div className="ap-qmap-toolbar">
     <div className="ap-qmap-layer-label"><Layers size={16}/>{t.map}</div>
     <div className="ap-qmap-layer-buttons">
      <button className="active" type="button">{t.map}</button>
      <button type="button" onClick={openSatellite}>{t.satellite}<ExternalLink size={12}/></button>
      <button type="button" onClick={()=>changeZoom(1)} title={t.zoomIn}><ZoomIn size={15}/></button>
      <button type="button" onClick={()=>changeZoom(-1)} title={t.zoomOut}><ZoomOut size={15}/></button>
      <button className="ap-qmap-expand" type="button" onClick={fullscreen} title={t.fullscreen}><Maximize2 size={15}/></button>
     </div>
    </div>
    <div className="ap-qmap-canvas-wrap">
     <div ref={mapNode} className="ap-qmap-canvas"/>
     {status==='loading'&&<div className="ap-qmap-overlay">{t.loading}</div>}
     {status==='missing'&&<div className="ap-qmap-overlay ap-qmap-error">{t.noKey}</div>}
     {status==='error'&&<div className="ap-qmap-overlay ap-qmap-error">{t.failed} {error}</div>}
    </div>
    <div className="ap-qmap-foot">
     <span><MapPin size={14}/>{t.center}</span>
     <span>39.50278, 63.85556</span>
    </div>
   </div>

   <aside className="ap-qmap-side">
    <div className="ap-qmap-stats">
     <article><Waves size={18}/><span>{t.total}</span><strong>{canals.length}</strong></article>
     <article><Layers size={18}/><span>{t.geometry}</span><strong><small>{t.waiting}</small></strong></article>
    </div>
    <div className="ap-qmap-list-head"><h3>{t.channels}</h3><span>{canals.length}</span></div>
    <label className="ap-qmap-search">
     <Search size={15}/>
     <input value={query} onChange={event=>setQuery(event.target.value)} placeholder={t.search}/>
    </label>
    {filtered.length===0
     ?<p className="ap-qmap-empty">{canals.length?t.noMatch:t.empty}</p>
     :<div className="ap-qmap-field-list">
       {filtered.map(canal=><article key={canal.id}>
        <strong>{canal.name}</strong>
        <span>{canal.code}</span>
        <small>{t.waiting}</small>
       </article>)}
      </div>}
    <div className="ap-qmap-note">
     <ShieldCheck size={16}/>
     <p>{t.hint}</p>
    </div>
   </aside>
  </div>
 </section>;
}
