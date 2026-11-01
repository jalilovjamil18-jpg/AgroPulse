'use client';
import T from '@/components/T';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronRight, Cloud,
  CloudSun, Droplets, Gauge, Landmark, Leaf, MapPinned, RadioTower, ShieldCheck,
  Smartphone, Sprout, Sun, Waves, Wifi, Zap, Building2, FlaskConical,
  ScanLine, Send, Copy, Network, CircleHelp,
} from 'lucide-react';
import UnifiedWaterPlatform from '@/components/UnifiedWaterPlatform';
import ProcessJourney from '@/components/ProcessJourney';
import { useLanguage } from '@/components/LanguageProvider';

type Audience = { title:string; subtitle:string; bullets:string[]; icon:typeof Sprout; image:string; accent:string };

const problems = [
  {title:'Sarf ko‘rinmaydi',desc:'Dalaga haqiqatan qancha suv kirganini o‘lchamasdan bilish qiyin.',icon:Waves,photo:'/images/company/irrigation-field.webp'},
  {title:'Taqsimot murakkab',desc:'Kanallar bo‘ylab suv taqsimotini kuzatish ko‘p mehnat talab qiladi.',icon:Network,photo:'/images/company/fields.webp'},
  {title:'Navbat va kelishuv',desc:'Suvdan foydalanishda shaffof ma’lumot va o‘zaro ishonch muhim.',icon:CircleHelp,photo:'/images/company/farmer.webp'},
  {title:'Qaror taxminga tayanadi',desc:'Sug‘orish rejasiga tuproq va ob-havo sharoiti ham ta’sir etadi.',icon:CloudSun,photo:'/images/company/sunset.webp'},
  {title:'Samarasizlik xavfi',desc:'Noto‘g‘ri sug‘orish xarajat va hosilga salbiy ta’sir ko‘rsatishi mumkin.',icon:Gauge,photo:'/images/company/fields.webp'},
];
const stages = [
  {title:'Kanal',subtitle:'Suv manbai',detail:'Jarayon sug‘orish kanalidan boshlanadi. Maqsad — suv oqimini muntazam o‘lchash va suv haqidagi ma’lumotni ko‘rinadigan qilish.',icon:Waves,status:'Ishlab chiqilmoqda',photo:'/images/company/stage-canal-visual.webp',imageText:'Sug‘orish kanali — konseptual vizual',features:[['Suv manbai','Kanal bo‘ylab kuzatuv'],['Monitoring','O‘lchov nuqtasi konsepti'],['Maqsad','Shaffof taqsimot']]},
  {title:'Sensor',subtitle:'O‘lchash qurilmasi',detail:'Radar yordamida suv bilan to‘g‘ridan-to‘g‘ri aloqa qilmasdan o‘lchash yondashuvi ishlab chiqilmoqda. Tasvir — qurilmaning fotorealistik konsept renderi.',icon:ScanLine,status:'Ishlab chiqilmoqda',photo:'/images/company/stage-sensor-visual.webp',imageText:'Radar qurilmasi — konsept render',features:[['Radar','Kontaktsiz yondashuv'],['Quvvat','Quyosh paneli konsepti'],['Holat','Ishlab chiqilmoqda']]},
  {title:'Aloqa',subtitle:'Ma’lumot uzatish',detail:'O‘lchovlarni GSM/4G orqali markaziy platformaga yuborish ko‘zda tutilgan. Vizual signal tarmog‘i real ulangan qurilmani anglatmaydi.',icon:Wifi,status:'Ishlab chiqilmoqda',photo:'/images/company/stage-aloqa-visual.webp',imageText:'GSM/4G — konsept render',features:[['GSM / 4G','Ma’lumot uzatish usuli'],['Tizim','Markaziy platformaga'],['Bosqich','Ishlab chiqilmoqda']]},
  {title:'Platforma',subtitle:'Raqamli boshqaruv',detail:'Kanallar, o‘lchovlar va qurilma holatlarini bir ekranda ko‘rish uchun interaktiv demo mavjud. Ko‘rsatkichlar namunaviy, jonli sensordan olinmaydi.',icon:BarChart3,status:'Ishlab chiqilgan (demo)',photo:'/images/company/stage-platform-visual.webp',imageText:'Raqamli platforma — UI demo maketi',features:[['Xarita','Konseptual ko‘rinish'],['Grafik','Demo ko‘rsatkichlar'],['Hisobot','Sinov interfeysi']]},
  {title:'Tavsiya',subtitle:'Ma’lumotdan qarorgacha',detail:'Suv, tuproq, ob-havo va ekin ma’lumotlariga asoslangan AI tavsiyalari — kelajakdagi imkoniyat. Namunaviy maslahatlar haqiqiy tavsiya emas.',icon:Sprout,status:'Reja',photo:'/images/company/stage-advice-visual.webp',imageText:'AI tavsiyalari — kelajak konsepti',features:[['AI tahlil','Rejalashtirilgan'],['Tuproq va ekin','Kelajak modullari'],['Tavsiya','Hozircha konsept']]},
];
const technologies = [
  {icon:ScanLine,title:'Radarli suv o‘lchovi',desc:'Suvga tegmasdan suv holatini kuzatish uchun radar o‘lchov yondashuvi ishlab chiqilmoqda.',state:'Ishlab chiqilmoqda',photo:'/images/company/stage-sensor-visual.webp',imageText:'Radarli qurilmaning fotorealistik konsept renderi',features:[['Radar','Kontaktsiz usul'],['O‘lchov','Prototip bosqichi'],['Dala sinovi','Hali tasdiqlanmagan']]},
  {icon:Wifi,title:'GSM / 4G aloqa',desc:'Dala qurilmasi yuborgan ma’lumotlarni platformaga uzatish uchun mobil aloqa arxitekturasi rejalashtirilgan.',state:'Ishlab chiqilmoqda',photo:'/images/company/stage-aloqa-visual.webp',imageText:'GSM/4G stansiyasi — konseptual tasvir',features:[['Tarmoq','GSM / 4G'],['Uzatish','Konsept'],['Ulanish','Hali real emas']]},
  {icon:Sun,title:'Quyosh energiyasi',desc:'Elektr tarmog‘idan uzoq joylar uchun quyosh paneliga asoslangan avtonom ishlash konsepsiyasi.',state:'Ishlab chiqilmoqda',photo:'/images/company/device-photo-concept.webp',imageText:'Quyosh paneli va o‘lchov postining konsept renderi',features:[['Quvvat','Quyosh paneli'],['Joylashuv','Dala sharoiti'],['Holat','Loyihalanmoqda']]},
  {icon:FlaskConical,title:'Tuproq va muhit datchiklari',desc:'Tuproq namligi, harorat va sho‘rlanish kabi qo‘shimcha ma’lumotlarni hisobga olish — keyingi rivojlanish rejasi.',state:'Reja',photo:'/images/company/fields.webp',imageText:'Dehqonchilik maydonining konseptual illyustratsiyasi',features:[['Namlik','Rejalashtirilgan'],['Harorat','Rejalashtirilgan'],['Sho‘rlanish','Rejalashtirilgan']]},
  {icon:BarChart3,title:'Raqamli boshqaruv',desc:'Kanal, suv sarfi, hudud va ogohlantirishlarni bir interfeysda ko‘rsatadigan demo platforma mavjud.',state:'Ishlab chiqilgan (demo)',photo:'/images/company/stage-platform-visual.webp',imageText:'AgroPulse boshqaruv paneli — konseptual UI maket',features:[['Xarita','Demo ko‘rinish'],['Grafik','Namuna qiymatlar'],['Platforma','Interaktiv demo']]},
  {icon:Zap,title:'AI qaror yordamchisi',desc:'Kelajakda monitoring natijalari asosida ehtimoliy tavsiya va ogohlantirishlarni ishlab chiqish ko‘zda tutilgan.',state:'Reja',photo:'/images/company/stage-advice-visual.webp',imageText:'Sun’iy intellekt tavsiyalari — konsept',features:[['Tavsiyalar','Reja'],['Tahlil','Kelajak moduli'],['Natija','Konsept ko‘rinish']]},
];
const audiences:Audience[] = [
  {title:'Fermerlar',subtitle:'“O‘z suvimni ko‘raman”',icon:Sprout,image:'/images/company/farmer.webp',accent:'lime',bullets:['Dala va suv haqidagi ma’lumotlarni bir joyda ko‘rish','Sug‘orishni yanada asosli rejalashtirish','Tuproq, ekin va ob-havo bilan bog‘liq tavsiyalar','Bir nechta maydonni boshqarish']},
  {title:'Irrigatsiya tashkilotlari',subtitle:'“Suv taqsimotini boshqaraman”',icon:Waves,image:'/images/company/irrigation-field.webp',accent:'cyan',bullets:['Kanallar va hisoblagich holatini kuzatish','Suv sarfini markazlashgan panelda taqqoslash','Ma’lumotni yig‘ishdagi qo‘l mehnatini kamaytirish maqsadi','Operativ rejalashtirish uchun vizual vositalar']},
  {title:'Mahalliy hokimiyatlar',subtitle:'“Hududning holatini ko‘raman”',icon:Landmark,image:'/images/company/fields.webp',accent:'sky',bullets:['Hududlar bo‘yicha ma’lumotlar bir ekranda','Kanallar va dalalar holatini xaritada ko‘rish konsepsiyasi','Ma’lumotga tayangan qarorlar uchun asos','Rivojlanish va joriy etish bosqichlarini kuzatish']},
  {title:'Hamkorlar va investorlar',subtitle:'“Kelajak tizimini birga quramiz”',icon:Building2,image:'/images/company/sunset.webp',accent:'gold',bullets:['AI va IoT asosidagi agrotexnologik yo‘nalish','Sinovdan boshlab kengayadigan platforma konsepsiyasi','Texnologik va infratuzilmaviy hamkorlik','Shaffof rivojlanish bosqichlari']},
];
const roadmap = [
  {phase:'G‘oya',title:'Ekotizim konsepsiyasi',desc:'Suv o‘lchovidan qaror qabul qilishgacha bo‘lgan yechimni loyihalashtirish.',status:'Konsept'},
  {phase:'Hozir',title:'Qurilma va platforma ustida ish',desc:'Radar o‘lchov yondashuvi ishlab chiqilmoqda, raqamli platformaning demo qismi mavjud.',status:'Jarayonda'},
  {phase:'Keyin',title:'Dala sharoitidagi sinov',desc:'Sensor aniqligi, aloqa ishonchliligi va foydalanish qulayligini tekshirish.',status:'Reja'},
  {phase:'Kelajak',title:'Hududlarga bosqichma-bosqich joriy etish',desc:'Dala → tuman → viloyat bo‘yicha bosqichli kengayish.',status:'Reja'},
];
function Status({label}:{label:string}){const {t}=useLanguage();return <span className={'aw-status '+(label.includes('demo')?'aw-status-demo':label==='Reja'?'aw-status-plan':'aw-status-build')}>{t(label)}</span>}
function Heading({eyebrow,title,desc,dark=false}:{eyebrow:string;title:string;desc?:string;dark?:boolean}){const {t}=useLanguage();return <div className={'aw-section-heading '+(dark?'aw-section-heading-dark':'')}><span className="aw-kicker"><span/> {t(eyebrow)}</span><h2>{t(title)}</h2>{desc&&<p>{t(desc)}</p>}</div>}
export default function Home(){
  const {t:__tr}=useLanguage();

  const {t, language}=useLanguage();
  const dashboardCopy={
    uz:{title:'Butun sug‘orish tizimi bitta ekranda.',desc:'Fermer, irrigatsiya, hokimiyat va administrator bir xil raqamli tizimning o‘zlariga mos demo ko‘rinishini shu yerda ko‘rishadi.',hint:'Rolni tanlang va Xarita, Sarf, Qurilmalar, Tavsiyalar, Ogohlantirishlar bo‘limlarini bir joyda ko‘ring.',services:'Fermer xizmatlariga o‘tish',cta:'Suv dashboardini ko‘rish',open:'Dashboardni shu yerda sinab ko‘rish',status:'Namoyish rejimi — barcha ko‘rsatkichlar sintetik'},
    ru:{title:'Вся система орошения на одном экране.',desc:'Фермеры, ирригационные службы, местные власти и администраторы видят свою демонстрационную версию единой системы.',hint:'Выберите роль и просмотрите карту, расход, устройства, рекомендации и оповещения в одном месте.',services:'Перейти к сервисам фермера',cta:'Открыть водный дашборд',open:'Попробовать дашборд здесь',status:'Демо-режим — все значения синтетические'},
    en:{title:'The entire irrigation system on one screen.',desc:'Farmers, irrigation teams, local authorities and administrators explore tailored views of one system.',hint:'Choose a role, then explore Map, Flow, Devices, Advice and Alerts in one place.',services:'Explore farmer services',cta:'Explore the water dashboard',open:'Try the dashboard here',status:'Demo mode — all values are synthetic'},
  }[language];
  const [stage,setStage]=useState(0);
  const [audience,setAudience]=useState(0);
  const [technology,setTechnology]=useState(0);
  const [formState,setFormState]=useState<'idle'|'ready'|'copied'|'error'>('idle');
  const [draft,setDraft]=useState('');
  useEffect(()=>{
    const els=document.querySelectorAll<HTMLElement>('.aw-reveal');
    if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('aw-visible'));return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('aw-visible');observer.unobserve(entry.target);}}),{rootMargin:'0px 0px -45px 0px',threshold:.08});
    els.forEach(el=>observer.observe(el));return()=>observer.disconnect();
  },[]);
  function prepareInquiry(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const values={name:String(data.get('name')||'').trim(),organization:String(data.get('organization')||'').trim(),role:String(data.get('role')||'').trim(),contact:String(data.get('contact')||'').trim(),message:String(data.get('message')||'').trim()};
    if(!values.name||!values.contact||!values.role||!values.message) return;
    const roleNames:Record<string,string>={farmer:'Fermer',irrigation:'Irrigatsiya',authority:'Hokimiyat',company:'Kompaniya',investor:'Investor',other:'Boshqa'};
    const text=[t('AGROPULSE — HAMKORLIK MUROJAATI'),`${t('Ism')}: ${values.name}`,`${t('Tashkilot')}: ${values.organization||t('Ko‘rsatilmagan')}`,`${t('Rol')}: ${t(roleNames[values.role]||values.role)}`,`${t('Aloqa')}: ${values.contact}`,'',`${t('Xabar')}: ${values.message}`].join('\n');
    setDraft(text);
    setFormState('ready');
  }
  async function copyInquiry(){
    try{
      await navigator.clipboard.writeText(draft);
      setFormState('copied');
    }catch{
      setFormState('error');
    }
  }
  const current=stages[stage];const StageIcon=current.icon;
  const currentTech=technologies[technology];const CurrentTechIcon=currentTech.icon;
  const selected=audiences[audience];const AudienceIcon=selected.icon;
  return <div className="aw-site">
    <section className="aw-hero" aria-labelledby="aw-hero-title">
      <div className="aw-hero-image" role="img" aria-label={__tr("Sug‘orish kanali va dalalar tasvirlangan fotorealistik konseptual illyustratsiya")}/>
      <div className="aw-hero-gradient"/>
      <div className="aw-grid-decor"/>
      <div className="aw-shell aw-hero-layout">
        <div className="aw-hero-copy aw-reveal">
          <span className="aw-hero-label"><span className="aw-live-dot"/><T text={" AI VA IoT ASOSIDAGI RAQAMLI SUV BOSHQARUVI"} /></span>
          <h1 id="aw-hero-title"><T text={"Suv hisobda."} /><br/><em><T text={"Qaror aniq."} /></em></h1>
          <p><T text={"AgroPulse sug‘orish kanallaridagi suv o‘lchovini kelajakda ob-havo, tuproq va aqlli tahlil bilan bog‘laydigan ekotizimni rivojlantirmoqda."} /></p>
          <div className="aw-hero-actions"><Link className="aw-btn aw-btn-lime" href="#yechim"><T text={"Ekotizimni o‘rganish "} /><ArrowUpRight size={19}/></Link><Link className="aw-btn aw-btn-ghost" href="#platforma">{dashboardCopy.cta} <ArrowRight size={18}/></Link></div>
          <div className="aw-hero-meta"><span><Check size={15}/><T text={" O‘zbekiston uchun yaratilmoqda"} /></span><span><ShieldCheck size={15}/><T text={" Demo va reja ochiq ko‘rsatiladi"} /></span><span><ScanLine size={15}/><T text={" Fon tasviri — konseptual illyustratsiya"} /></span></div>
        </div>
        <div className="aw-hero-visual" aria-label={__tr("Raqamli monitoringning konseptual ifodasi")}>
          <div className="aw-hero-data-card"><span className="aw-card-top"><span className="aw-live-dot"/><T text={" KO‘RGAZMALI TIZIM "} /><Status label="Konsept"/></span><div className="aw-data-flow"><Waves size={35}/><span className="aw-pulse-visual"/><RadioTower size={33}/><span className="aw-pulse-visual"/><BarChart3 size={35}/></div><strong><T text={"Kanaldan ma’lumotgacha"} /></strong><small><T text={"Suv oqimi → sensor → boshqaruv paneli"} /></small></div>
          <div className="aw-hero-side-note"><span className="aw-side-line"/><span><T text={"O‘LCHANG "} /><b>·</b><T text={" TUSHUNING "} /><b>·</b><T text={" BOSHQARING"} /></span></div>
        </div>
      </div>
      <Link href="#muammo" className="aw-scroll-hint"><T text={"Pastga tushib tanishing "} /><ArrowDown size={16}/></Link>
    </section>

    <section className="aw-problem aw-section" id="muammo">
      <div className="aw-shell"><Heading eyebrow="01 / MUAMMO" title={__tr("Ko‘rinmaydigan suvni boshqarib bo‘lmaydi.")} desc="Sug‘orishda aniqlik — suv qanday taqsimlanayotgani, qancha sarflanayotgani va qaysi vaziyatda qaror kerakligini ko‘rishdan boshlanadi."/>
        <div className="aw-problem-grid">{problems.map(({title,desc,icon:Icon,photo},i)=><article className="aw-problem-card aw-reveal" key={title} style={{backgroundImage:`linear-gradient(0deg,rgba(5,21,36,.95),rgba(5,25,43,.10) 100%),url('${photo}')`}}><div className="aw-problem-num">0{i+1}</div><div className="aw-problem-bottom"><Icon size={25}/><h3>{t(title)}</h3><p>{t(desc)}</p></div></article>)}</div>
        <p className="aw-fact-note"><ShieldCheck size={16}/><T text={" Ushbu bo‘limda tasdiqlanmagan raqamlar yoki suv tejash foizlari ishlatilmagan."} /></p>
      </div>
    </section>

    <section className="aw-solution aw-section" id="yechim">
      <div className="aw-shell"><Heading eyebrow="02 / YECHIM" title={__tr("Hisoblagich emas — butun ekotizim.")} desc="AgroPulse qurilma, aloqa, raqamli platforma va kelajakdagi tavsiyalarni bir uzluksiz ma’lumot zanjiriga birlashtirishni maqsad qilgan." dark/>
        <div className="awfin-process" aria-label={__tr("Suv o‘lchovidan tavsiyagacha bo‘lgan besh bosqich")}>
          <div className="awfin-tabs" role="group" aria-label={__tr("Jarayon bosqichlari")}>
            {stages.map((item,i)=>{const Icon=item.icon;return <button key={item.title} type="button" className={stage===i?'is-active':''} onClick={()=>setStage(i)} aria-pressed={stage===i}><Icon size={20}/><span>{t(item.title)}</span></button>})}
          </div>
          <div className="awfin-process-main">
            <figure className="awfin-process-visual" key={current.title}>
              <div className="awfin-process-photo" style={{backgroundImage:`linear-gradient(0deg,rgba(4,18,33,.9),rgba(4,20,34,.06) 75%),url('${current.photo}')`}} role="img" aria-label={t(current.imageText)}/>
              <div className="awfin-photo-top"><span className="awfin-glass"><StageIcon size={19}/><T text={" AGROPULSE / BOSQICH "} />{String(stage+1).padStart(2,'0')}</span><Status label={current.status}/></div>
              <figcaption><span className="awfin-visual-kicker">{t(current.imageText)}</span><strong>{t(current.title)}</strong><p>{t(current.subtitle)}</p></figcaption>
            </figure>
            <div className="awfin-info" aria-live="polite">
              <div className="awfin-info-top"><span>0{stage+1} / 05</span><Status label={current.status}/></div>
              <div className="awfin-info-icon"><StageIcon size={30}/></div>
              <h3>{t(current.title)} <ArrowRight size={24}/></h3>
              <h4>{t(current.subtitle)}</h4>
              <p>{t(current.detail)}</p>
              <div className="awfin-info-actions"><button type="button" onClick={()=>setStage((stage+1)%stages.length)}><T text={"Keyingi bosqich "} /><ArrowRight size={18}/></button><span><T text={"Vizual konsept / demo"} /></span></div>
            </div>
          </div>
          <div className="awfin-detail-row" aria-label={__tr("Tanlangan bosqich haqida qisqacha")}>
            {current.features.map(([name,explanation],i)=><div className="awfin-feature" key={`${current.title}-${name}`}><span className="awfin-feature-count">0{i+1}</span><div><strong>{t(name)}</strong><small>{t(explanation)}</small></div></div>)}
          </div>
          <div className="awfin-process-line" aria-label={__tr("Jarayon zanjiri")}>
            <div className="awfin-chain-heading"><strong><T text={"Ma’lumot yo‘li"} /></strong><span><T text={"Kanal → Sensor → Aloqa → Platforma → Tavsiya"} /></span></div>
            <div className="awfin-chain-track">{stages.map((item,i)=>{const Icon=item.icon;return <button type="button" key={item.title} className={i<=stage?'is-passed':''} aria-pressed={i===stage} onClick={()=>setStage(i)}><Icon size={19}/><span>{t(item.title)}</span></button>})}</div>
          </div>
        </div>
        <div className="aw-mini-status"><span><Status label="Ishlab chiqilgan (demo)"/><T text={" Raqamli interfeys"} /></span><span><Status label="Ishlab chiqilmoqda"/><T text={" Suv o‘lchov qurilmasi"} /></span><span><Status label="Reja"/><T text={" AI va tuproq modullari"} /></span></div>
      </div>
    </section>

    <section className="aw-technology aw-section" id="texnologiya">
      <div className="aw-shell"><Heading eyebrow="03 / TEXNOLOGIYA" title={__tr("Dala uchun yaratilayotgan texnologiya.")} desc="Nazariya emas, o‘lchovdan boshlanadigan tizim. Qurilma tasvirlari bu bosqichda texnik konsept bo‘lib, dala qurilmasining haqiqiy fotosurati sifatida ko‘rsatilmaydi." dark/>
        <div className="awfin-tech-layout">
          <figure className="awfin-tech-visual" key={technology}>
            <div className="awfin-tech-photo" style={{backgroundImage:`linear-gradient(0deg,rgba(2,18,32,.93),rgba(5,25,42,.03) 73%),url('${currentTech.photo}')`}} role="img" aria-label={t(currentTech.imageText)}/>
            <div className="awfin-photo-top"><span className="awfin-glass"><CurrentTechIcon size={18}/><T text={" TEXNOLOGIYA / 0"} />{technology+1}</span><Status label={currentTech.state}/></div>
            <figcaption><strong>{t(currentTech.title)}</strong><p>{t(currentTech.imageText)}</p><span><T text={"Vizual tasvir — konsept / demo, haqiqiy qurilmadan olingan surat emas."} /></span></figcaption>
          </figure>
          <div className="awfin-tech-content">
            <div className="awfin-tech-selected" aria-live="polite">
              <div className="awfin-info-top"><span>0{technology+1} / 06</span><Status label={currentTech.state}/></div>
              <div className="awfin-info-icon"><CurrentTechIcon size={26}/></div>
              <h3>{t(currentTech.title)}</h3><p>{t(currentTech.desc)}</p>
              <div className="awfin-tech-points">{currentTech.features.map(([label,info])=><div key={label}><strong>{t(label)}</strong><small>{t(info)}</small></div>)}</div>
            </div>
            <div className="awfin-tech-cards" role="group" aria-label={__tr("Texnologiyalar")}>
              {technologies.map(({icon:Icon,title,state},i)=><button type="button" aria-pressed={technology===i} className={'awfin-tech-card '+(technology===i?'is-selected':'')} key={title} onClick={()=>setTechnology(i)}><span className="awfin-tech-card-icon"><Icon size={20}/></span><span><strong>{t(title)}</strong><small>{t(state)}</small></span></button>)}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="aw-how aw-section" id="qanday-ishlaydi"><div className="aw-shell"><Heading eyebrow="04 / JARAYON" title={__tr("Bir ma’lumot oqimi. Bir qaror zanjiri.")} desc="Dalada boshlangan ma’lumot qanday qilib foydali ko‘rsatkichga aylanishini to‘rtta bosqichda ko‘ring."/>
      <ProcessJourney/>
      <div className="aw-how-cta"><div><strong><T text={"Platforma qanday ko‘rinishini sinab ko‘ring"} /></strong><p><T text={"Real qurilmaga ulanmagan namunaviy qiymatlar bilan ishlaydigan suv monitoringi demosini oching."} /></p></div><Link className="aw-btn aw-btn-dark" href="/#platforma">{dashboardCopy.open} <ArrowUpRight size={18}/></Link></div>
    </div></section>

    <section className="aw-audience aw-section" id="kimlar-uchun"><div className="aw-shell"><Heading eyebrow="05 / KIMLAR UCHUN" title={__tr("Har bir foydalanuvchiga — o‘z ko‘rinishi.")} desc="Suv, dala va hududga oid axborot har bir rolning vazifasiga mos taqdim etiladi."/>
      <div className="aw-audience-tabs" role="tablist" aria-label={__tr("Foydalanuvchi turlari")}>{audiences.map((a,i)=><button type="button" role="tab" id={`aw-audience-tab-${i}`} aria-controls="aw-audience-panel" aria-selected={audience===i} key={a.title} className={audience===i?'selected':''} onClick={()=>setAudience(i)}>{t(a.title)}</button>)}</div>
      <div className="aw-audience-body" role="tabpanel" id="aw-audience-panel" aria-labelledby={`aw-audience-tab-${audience}`}><div className="aw-audience-photo" style={{backgroundImage:`linear-gradient(90deg,transparent,rgba(8,30,47,.12)),url('${selected.image}')`}}/><div className="aw-audience-detail"><span className="aw-audience-icon"><AudienceIcon size={26}/></span><span className="aw-kicker"><span/><T text={" YO‘NALISH 0"} />{audience+1}</span><h3>{t(selected.title)}</h3><p>{t(selected.subtitle)}</p><ul>{selected.bullets.map(item=><li key={item}><Check size={16}/>{t(item)}</li>)}</ul></div></div>
    </div></section>

    <section className="aw-platform aw-section aw-platform-embedded" id="platforma" aria-labelledby="aw-dashboard-title">
      <div className="aw-shell">
        <span className="aw-kicker aw-kicker-light"><span/> <T text={"06 / RAQAMLI PLATFORMA"} /></span>
        <div className="aw-dashboard-intro">
          <div>
            <h2 id="aw-dashboard-title">{dashboardCopy.title}</h2>
            <p>{dashboardCopy.desc}</p>
          </div>
          <span className="aw-dashboard-status"><ShieldCheck size={16}/>{dashboardCopy.status}</span>
        </div>
        <p className="aw-dashboard-hint">{dashboardCopy.hint}</p>
      </div>
      <div id="suv-monitoringi" className="aw-home-dashboard-wide aw-home-dashboard-unified" aria-label={t("Suv monitoringi")}>
        <UnifiedWaterPlatform/>
      </div>
      <div className="aw-shell aw-dashboard-footer">
        <div className="aw-platform-no-claims"><ShieldCheck size={18}/><T text={" Namuna ko‘rsatkichlar haqiqiy suv o‘lchovi emas."} /></div>
        
      </div>
    </section>

    <section className="aw-roadmap aw-section" id="yol-xaritamiz"><div className="aw-shell"><Heading eyebrow="07 / YO‘L XARITASI" title={__tr("Biz hozir qayerdamiz?")} desc="O‘lchovdan katta ekotizimgacha bo‘lgan yo‘lni tekshiriladigan bosqichlar bilan ko‘rsatamiz. Tasdiqlanmagan muddat yoki yutuqlarni e’lon qilmaymiz."/>
      <div className="aw-roadmap-grid">{roadmap.map((r,i)=><article className="aw-roadmap-card aw-reveal" key={r.phase}><div><span>0{i+1}</span><Status label={r.status}/></div><small>{t(r.phase)}</small><h3>{t(r.title)}</h3><p>{t(r.desc)}</p></article>)}</div></div></section>

    <section className="aw-vision" id="qarash"><div className="aw-vision-image"/><div className="aw-shell aw-vision-layout"><span className="aw-kicker aw-kicker-light"><span/><T text={" O‘ZBEKISTON UCHUN QARASHIMIZ"} /></span><h2><T text={"Suv, tuproq, ekin va inson — "} /><em><T text={"bitta ekotizimda."} /></em></h2><p><T text={"Biz suvni o‘lchashdan boshlaymiz. Maqsad esa undan kengroq: daladagi ma’lumotni tushunarli ko‘rsatkich, shaffof boshqaruv va asosli qarorga aylantirish."} /></p><Link className="aw-btn aw-btn-lime" href="#platforma"><T text={"Yerdan hosilgacha. Hammasi bir joyda. "} /><ArrowUpRight size={18}/></Link></div></section>

    <section className="aw-partner aw-section" id="hamkorlik"><div className="aw-shell aw-partner-layout"><div className="aw-partner-intro"><span className="aw-kicker"><span/><T text={" 08 / HAMKORLIK"} /></span><h2><T text={"Kelajak sug‘orishini "} /><em><T text={"birga quramiz."} /></em></h2><p><T text={"Fermer, irrigatsiya tashkiloti, kompaniya yoki strategik hamkor bo‘lsangiz, hamkorlik taklifingizni tayyorlang. Tasdiqlangan aloqa kanali berilguncha bu forma serverga hech qanday ma’lumot yubormaydi."} /></p><div className="aw-partner-notes"><span><ShieldCheck size={18}/><T text={" Hech qanday tasdiqlanmagan hamkorlik e’lon qilinmaydi."} /></span><span><MapPinned size={18}/><T text={" Boshlanish nuqtasi — O‘zbekiston."} /></span></div></div>
      <form className="aw-form" onSubmit={prepareInquiry} onChange={()=>{setDraft('');setFormState('idle')}}><div className="aw-form-top"><div><span><T text={"HAMKORLIK SO‘ROVI"} /></span><h3><T text={"Bizga yozing"} /></h3></div><Send size={23}/></div>
        <div className="aw-form-row"><label><T text={"Ismingiz *"} /><input name="name" required maxLength={120} minLength={2} placeholder={__tr("Ism familiya")} autoComplete="name"/></label><label><T text={"Tashkilot"} /><input name="organization" maxLength={180} placeholder={__tr("Ixtiyoriy")}/></label></div>
        <div className="aw-form-row"><label><T text={"Kim sifatida? *"} /><select name="role" required defaultValue=""><option value="" disabled><T text={"Tanlang"} /></option><option value="farmer"><T text={"Fermer"} /></option><option value="irrigation"><T text={"Irrigatsiya"} /></option><option value="authority"><T text={"Hokimiyat"} /></option><option value="company"><T text={"Kompaniya"} /></option><option value="investor"><T text={"Investor"} /></option><option value="other"><T text={"Boshqa"} /></option></select></label><label><T text={"Telefon yoki email *"} /><input name="contact" required maxLength={150} placeholder={__tr("+998 ... yoki email")}/></label></div>
        <label><T text={"Xabaringiz *"} /><textarea name="message" minLength={10} maxLength={2000} rows={4} required placeholder={__tr("Hamkorlik g‘oyangizni qisqacha yozing...")}/></label>
        <button className="aw-btn aw-btn-dark aw-form-button" type="submit"><T text={"Murojaat matnini tayyorlash "} /><ArrowRight size={18}/></button>
        {draft&&<div className="aw-inquiry-draft" aria-live="polite"><strong><T text={"Yuborishga tayyor matn"} /></strong><p><T text={"So‘rov serverga yuborilmadi. Quyidagi matnni nusxalab, AgroPulse tasdiqlagan aloqa kanaliga jo‘nating."} /></p><textarea aria-label={__tr("Tayyorlangan murojaat matni")} rows={8} readOnly value={draft}/><button type="button" className="aw-copy-btn" onClick={copyInquiry}><Copy size={17}/><T text={" Matnni nusxalash"} /></button></div>}
        {formState==='copied'&&<p role="status" className="aw-form-feedback is-success"><T text={"Matn nusxalandi. Uni tasdiqlangan aloqa kanaliga yuborishingiz mumkin."} /></p>}
        {formState==='error'&&<p role="status" className="aw-form-feedback is-error"><T text={"Avtomatik nusxalashga ruxsat berilmadi. Yuqoridagi matnni qo‘lda belgilang va nusxalang."} /></p>}
        <p className="aw-form-disclaimer"><T text={"API hali ulanmagan. Aloqa ma’lumotlari [TASDIQLANADI]; so‘rov yuborilgani yoki saqlangani haqida yolg‘on tasdiq ko‘rsatilmaydi."} /></p>
      </form>
    </div></section>
  </div>;
}
