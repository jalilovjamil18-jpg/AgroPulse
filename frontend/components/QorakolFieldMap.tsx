'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {ExternalLink,Layers,MapPin,Maximize2,Satellite,Search,ShieldCheck,Sprout} from 'lucide-react';

type FieldItem={id:number;name:string;crop:string;area_ha:string;area_id:number|null;canal_id:number|null};
type Lang='uz'|'ru'|'en';
type YandexPlacemark={};
type YandexMap={
  geoObjects:{add:(object:YandexPlacemark)=>void};
  destroy:()=>void;
  setType:(type:string)=>void;
  container:{fitToViewport:()=>void};
};
type YandexMapsApi={
  ready:(callback:()=>void)=>void;
  Map:new (element:HTMLElement,options:Record<string,unknown>)=>YandexMap;
  Placemark:new (coordinates:number[],properties:Record<string,string>,options?:Record<string,unknown>)=>YandexPlacemark;
};
declare global { interface Window { ymaps?:YandexMapsApi } }

const CENTER:[number,number]=[39.517043,63.840141];

function loadYandexMaps(key:string):Promise<YandexMapsApi>{
 return new Promise((resolve,reject)=>{
  const ready=()=>{if(!window.ymaps){reject(new Error('Yandex Maps API yuklanmadi.'));return;}window.ymaps.ready(()=>resolve(window.ymaps!));};
  if(window.ymaps){ready();return;}
  let script=document.querySelector<HTMLScriptElement>('script[data-agropulse-yandex]');
  if(script){
   script.addEventListener('load',ready,{once:true});
   script.addEventListener('error',()=>reject(new Error('Yandex Maps serveriga ulanib bo‘lmadi.')),{once:true});
   return;
  }
  script=document.createElement('script');
  script.dataset.agropulseYandex='true';
  script.src=`https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key)}&lang=ru_RU`;
  script.async=true;
  script.onload=ready;
  script.onerror=()=>reject(new Error('Yandex Maps API kaliti yoki internet aloqasini tekshiring.'));
  document.head.appendChild(script);
 });
}

const words={
 uz:{title:'Qorako‘l tumani xaritasi',subtitle:'Sun’iy yo‘ldosh va sxematik xarita',total:'Jami maydonlar',hectares:'Umumiy maydon',fields:'Dalalar ro‘yxati',empty:'Hozircha dalalar kiritilmagan',missing:'Dalalar uchun koordinatalar hali kiritilmagan',hint:'Kadastr koordinatalari yoki GeoJSON/KML fayli yuklangach, yer uchastkalari chegaralari xaritada alohida ko‘rsatiladi.',center:'Qorako‘l tumani markazi',loading:'Xarita yuklanmoqda…',noKey:'Yandex API kaliti ulanmagan. frontend/.env.local fayliga NEXT_PUBLIC_YANDEX_MAPS_API_KEY ni kiriting va frontendni qayta ishga tushiring.',failed:'Xarita yuklanmadi. API kaliti faolligini va 127.0.0.1 uchun HTTP Referer cheklovini tekshiring.',satellite:'Sputnik',map:'Xarita',hybrid:'Gibrid',fullscreen:'To‘liq ekran',search:'Dala nomi bo‘yicha qidirish…',noMatch:'Mos dala topilmadi',open:'Yandex Maps’da ochish',real:'Haqiqiy ma’lumotlar'},
 ru:{title:'Карта Каракульского района',subtitle:'Спутник и схема',total:'Всего участков',hectares:'Общая площадь',fields:'Список полей',empty:'Поля пока не добавлены',missing:'Координаты полей пока не внесены',hint:'После загрузки кадастровых координат или файла GeoJSON/KML границы участков будут показаны на карте.',center:'Центр Каракульского района',loading:'Загрузка карты…',noKey:'Ключ Yandex API не подключён. Добавьте NEXT_PUBLIC_YANDEX_MAPS_API_KEY в frontend/.env.local и перезапустите frontend.',failed:'Не удалось загрузить карту. Проверьте активацию ключа и HTTP Referer для 127.0.0.1.',satellite:'Спутник',map:'Карта',hybrid:'Гибрид',fullscreen:'На весь экран',search:'Поиск поля…',noMatch:'Поле не найдено',open:'Открыть в Яндекс Картах',real:'Реальные данные'},
 en:{title:'Qorako‘l district map',subtitle:'Satellite and schematic map',total:'Total fields',hectares:'Total area',fields:'Field register',empty:'No fields have been added yet',missing:'Field coordinates have not been added yet',hint:'Once cadastral coordinates or a GeoJSON/KML file are provided, parcel boundaries can be shown individually on the map.',center:'Qorako‘l district centre',loading:'Loading map…',noKey:'Yandex API key is not configured. Add NEXT_PUBLIC_YANDEX_MAPS_API_KEY to frontend/.env.local and restart the frontend.',failed:'Map failed to load. Check key activation and HTTP Referer restrictions for 127.0.0.1.',satellite:'Satellite',map:'Map',hybrid:'Hybrid',fullscreen:'Fullscreen',search:'Search fields…',noMatch:'No matching field',open:'Open in Yandex Maps',real:'Live data'}
};

export default function QorakolFieldMap({fields,lang}:{fields:FieldItem[];lang:Lang}){
 const t=words[lang];const mapNode=useRef<HTMLDivElement|null>(null);const mapRef=useRef<YandexMap|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'error'|'missing'>('loading');
 const [error,setError]=useState('');const [layer,setLayer]=useState<'hybrid'|'satellite'|'map'>('hybrid');const [query,setQuery]=useState('');
 const totalArea=useMemo(()=>fields.reduce((sum,item)=>sum+Number(item.area_ha||0),0),[fields]);
 const filtered=useMemo(()=>fields.filter(field=>(field.name+' '+field.crop).toLowerCase().includes(query.toLowerCase())),[fields,query]);

 useEffect(()=>{
  const key=process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if(!key){setStatus('missing');return;}
  let cancelled=false;let instance:YandexMap|null=null;
  loadYandexMaps(key).then(api=>{
   if(cancelled||!mapNode.current)return;
   instance=new api.Map(mapNode.current,{
    center:CENTER,zoom:12,type:'yandex#hybrid',
    controls:['zoomControl','typeSelector','fullscreenControl','geolocationControl'],
    suppressMapOpenBlock:true
   });
   const marker=new api.Placemark(CENTER,{hintContent:t.center,balloonContent:`<strong>Qorako‘l tumani</strong><br/>Buxoro viloyati`},{preset:'islands#greenDotIconWithCaption'});
   instance.geoObjects.add(marker);mapRef.current=instance;setStatus('ready');
   window.setTimeout(()=>instance?.container.fitToViewport(),150);
  }).catch(err=>{if(!cancelled){setError(err instanceof Error?err.message:'');setStatus('error')}});
  return()=>{cancelled=true;if(instance){instance.destroy();if(mapRef.current===instance)mapRef.current=null;}};
 },[t.center]);

 function changeLayer(next:'hybrid'|'satellite'|'map'){setLayer(next);mapRef.current?.setType(next==='map'?'yandex#map':next==='satellite'?'yandex#satellite':'yandex#hybrid');}
 function fullscreen(){const node=mapNode.current?.parentElement;if(!node)return;if(document.fullscreenElement)void document.exitFullscreen();else void node.requestFullscreen?.();}

 return <section className="ap-qmap">
  <header className="ap-qmap-head">
   <div><span className="ap-real-kicker">AGROPULSE / QORAKO‘L / {t.real}</span><h2><MapPin size={22}/>{t.title}</h2><p>{t.subtitle}</p></div>
   <div className="ap-qmap-head-actions"><span><ShieldCheck size={14}/>{t.real}</span><a href="https://yandex.uz/maps/?ll=63.840141%2C39.517043&z=12" target="_blank" rel="noreferrer">{t.open}<ExternalLink size={14}/></a></div>
  </header>
  <div className="ap-qmap-layout">
   <div className="ap-qmap-main">
    <div className="ap-qmap-toolbar">
     <div className="ap-qmap-layer-label"><Layers size={16}/> {t.subtitle}</div>
     <div className="ap-qmap-layer-buttons">
      <button className={layer==='hybrid'?'active':''} onClick={()=>changeLayer('hybrid')}>{t.hybrid}</button>
      <button className={layer==='satellite'?'active':''} onClick={()=>changeLayer('satellite')}><Satellite size={14}/>{t.satellite}</button>
      <button className={layer==='map'?'active':''} onClick={()=>changeLayer('map')}>{t.map}</button>
      <button className="ap-qmap-expand" onClick={fullscreen} title={t.fullscreen}><Maximize2 size={15}/></button>
     </div>
    </div>
    <div className="ap-qmap-canvas-wrap">
     <div ref={mapNode} className="ap-qmap-canvas"/>
     {status==='loading'&&<div className="ap-qmap-overlay">{t.loading}</div>}
     {status==='missing'&&<div className="ap-qmap-overlay ap-qmap-error">{t.noKey}</div>}
     {status==='error'&&<div className="ap-qmap-overlay ap-qmap-error">{t.failed} {error}</div>}
    </div>
    <div className="ap-qmap-foot"><span><MapPin size={14}/>{t.center}</span><span>39.517043, 63.840141</span></div>
   </div>
   <aside className="ap-qmap-side">
    <div className="ap-qmap-stats"><article><Sprout size={18}/><span>{t.total}</span><strong>{fields.length}</strong></article><article><Layers size={18}/><span>{t.hectares}</span><strong>{new Intl.NumberFormat('uz-UZ',{maximumFractionDigits:2}).format(totalArea)} <small>ga</small></strong></article></div>
    <div className="ap-qmap-list-head"><h3>{t.fields}</h3><span>{fields.length}</span></div>
    <label className="ap-qmap-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></label>
    {filtered.length===0?<p className="ap-qmap-empty">{fields.length?t.noMatch:t.empty}</p>:<div className="ap-qmap-field-list">{filtered.map(field=><article key={field.id}><strong>{field.name}</strong><span>{field.crop||'—'} · {field.area_ha} ga</span><small>{t.missing}</small></article>)}</div>}
    <div className="ap-qmap-note"><ShieldCheck size={16}/><p>{t.hint}</p></div>
   </aside>
  </div>
 </section>;
}
