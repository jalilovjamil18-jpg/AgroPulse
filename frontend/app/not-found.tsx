import T from '@/components/T';
import Link from 'next/link';
import { ArrowLeft, Search, Sprout } from 'lucide-react';
export default function NotFound(){
  return <section className="ap10-state-page"><div className="container ap10-state-card"><span className="ap10-state-symbol"><Sprout size={35}/></span><span className="ap10-state-number">404</span><h1><T text={"Bu sahifa topilmadi."} /></h1><p><T text={"Havola o‘zgargan yoki sahifa mavjud emas. Bosh sahifadan kerakli xizmatni tanlang."} /></p><div className="ap10-state-actions"><Link href="/"><ArrowLeft size={18}/><T text={" Bosh sahifa"} /></Link><Link href="/#platforma"><Search size={18}/><T text={" Raqamli platforma"} /></Link></div></div></section>;
}
