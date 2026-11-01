'use client';
import T from '@/components/T';
import {useEffect} from 'react';
import Link from 'next/link';
import {AlertCircle, ArrowLeft, RotateCcw} from 'lucide-react';
export default function ErrorPage({error,reset}:{error:Error & {digest?:string},reset:()=>void}){
  useEffect(()=>{console.error('AgroPulse sahifa xatosi:',error);},[error]);
  return <section className="ap10-state-page"><div className="container ap10-state-card"><span className="ap10-state-symbol"><AlertCircle size={35}/></span><h1><T text={"Sahifada muammo yuz berdi."} /></h1><p><T text={"Ma’lumotlar yuklanayotganda xatolik bo‘ldi. Yana bir bor urinib ko‘ring."} /></p><div className="ap10-state-actions"><button type="button" onClick={reset}><RotateCcw size={17}/><T text={" Qayta urinish"} /></button><Link href="/"><ArrowLeft size={17}/><T text={" Bosh sahifa"} /></Link></div></div></section>;
}
