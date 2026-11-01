'use client';
import T from '@/components/T';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useHeaderMotion } from '@/components/useHeaderMotion';
import { useLanguage } from '@/components/LanguageProvider';

const links = [
  ['Muammo','#muammo'],['Yechim','#yechim'],['Texnologiya','#texnologiya'],
  ['Qanday ishlaydi','#qanday-ishlaydi'],['Kimlar uchun','#kimlar-uchun'],
  ['Platforma','#platforma'],
  ['Yo‘l xaritasi','#yol-xaritamiz']
];

/**
 * Navigation motion inspired by the supplied reference video:
 * scrolling down collapses the floating header to a logo-only capsule;
 * scrolling up restores the complete navigation. The AgroPulse branding,
 * menu items and links are intentionally unchanged.
 */
export default function CorporateHeader(){
  const {t}=useLanguage();
  const [open,setOpen]=useState(false);
  const [languageMenuOpen,setLanguageMenuOpen]=useState(false);
  const {compact, scrolled, reveal} = useHeaderMotion({locked: open || languageMenuOpen});

  useEffect(()=>{
    const onEscape=(event:KeyboardEvent)=>{
      if(event.key==='Escape') setOpen(false);
    };
    document.addEventListener('keydown',onEscape);
    return ()=>document.removeEventListener('keydown',onEscape);
  },[open]);

  return <header className={'aw-header aw-header--motion'+(scrolled?' aw-header--scrolled':'')+(compact?' aw-header--compact':'')}>
    <div className="aw-header-inner" onMouseEnter={reveal} onFocusCapture={reveal}>
      <Link href="/" className="aw-logo" aria-label={t("AgroPulse bosh sahifa")} onClick={()=>{setOpen(false);reveal();}}>
        <Image src="/brand/icon.png" width={44} height={44} alt="" priority/>
        <span><strong>Agro<span>Pulse</span></strong><small><T text={"AI · IoT · SUV BOSHQARUVI"} /></small></span>
      </Link>
      <nav className="aw-nav" aria-label={t("Kompaniya sayti navigatsiyasi")}>
        {links.map(([label,href])=><Link key={href} href={'/'+href}>{t(label)}</Link>)}
      </nav>
      <div className="aw-header-actions">
        <Link href="/kabinet" className="aw-nav-platform">{t("Kabinet")} <ArrowUpRight size={15}/></Link>
        <Link href="/#hamkorlik" className="aw-nav-cta">{t("Hamkorlik")} <ArrowUpRight size={16}/></Link>
        <LanguageSwitcher onOpenChange={setLanguageMenuOpen}/>
        <button type="button" className="aw-menu-btn" aria-expanded={open} aria-controls="aw-mobile-menu" aria-label={t(open?'Menyuni yopish':'Menyuni ochish')} onClick={()=>setOpen(value=>!value)}>{open?<X size={23}/>:<Menu size={23}/>}</button>
      </div>
    </div>
    {open&&<nav className="aw-mobile-menu" id="aw-mobile-menu" aria-label={t("Mobil menyu")}>
      {links.map(([label,href])=><Link key={href} href={'/'+href} onClick={()=>setOpen(false)}>{t(label)}<ArrowUpRight size={16}/></Link>)}
      <Link href="/kabinet" onClick={()=>setOpen(false)}>{t("Real kabinet")} <ArrowUpRight size={16}/></Link>
      <Link href="/#platforma" onClick={()=>setOpen(false)}>{t("Demo panelni ochish")} <ArrowUpRight size={16}/></Link>
      <Link href="/#hamkorlik" onClick={()=>setOpen(false)}>{t("Hamkorlik uchun murojaat")} <ArrowUpRight size={16}/></Link>
    </nav>}
  </header>;
}
