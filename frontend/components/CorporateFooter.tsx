'use client';
import T from '@/components/T';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
export default function CorporateFooter(){
  const {t}=useLanguage();
  return <footer className="aw-footer">
    <div className="aw-shell aw-footer-grid">
      <div><Link className="aw-footer-brand" href="/"><Image src="/brand/icon.png" alt="" width={43} height={43}/> <span>Agro<strong>Pulse</strong></span></Link>
        <p>{t('Suvdan oqilona foydalanish sari. O‘zbekiston uchun AI va IoT asosidagi raqamli suv boshqaruvi ekotizimi ustida ishlanmoqda.')}</p>
        <span className="aw-footer-note"><ShieldCheck size={16}/>{t("Texnologik holatlar ochiq belgilangan")}</span>
      </div>
      <div><h3>AgroPulse</h3><Link href="/#muammo">{t('Muammo')}</Link><Link href="/#yechim">{t('Yechim')}</Link><Link href="/#texnologiya">{t('Texnologiya')}</Link><Link href="/#yol-xaritamiz">{t('Yo‘l xaritasi')}</Link></div>
      <div><h3>{t('Platforma')}</h3><Link href="/#platforma">{t('Raqamli platforma')}</Link><Link href="/#kimlar-uchun">{t('Kimlar uchun')}</Link><Link href="/#qanday-ishlaydi">{t('Qanday ishlaydi')}</Link></div>
      <div><h3>{t('Aloqa')}</h3><p>{t('Rasmiy telefon, email va manzil ish egasi tomonidan tasdiqlangach e’lon qilinadi.')}</p><Link className="aw-footer-contact" href="/#hamkorlik">{t('Hamkorlik so‘rovi')} <Mail size={15}/></Link></div>
    </div>
    <div className="aw-shell aw-footer-bottom"><span>© {new Date().getFullYear()}<T text={" AgroPulse. "} />{t("Mahsulot konsepsiyasi va demo.")}</span><Link href="/#platforma">{t('Demo panel')} <ArrowUpRight size={14}/></Link></div>
  </footer>
}
