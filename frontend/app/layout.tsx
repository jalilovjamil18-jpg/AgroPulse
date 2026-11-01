import type { Metadata } from 'next';
import './globals.css';
import './water-company.css';
import './water-front-v110.css';
import './water-front-final.css';
import './header-scroll-effect.css';
import './language-switcher.css';
import './unified-platform.css';
import './real-cabinet.css';
import { LanguageProvider } from '@/components/LanguageProvider';
import SiteNav from '@/components/SiteNav';
import Footer from '@/components/Footer';
export const metadata:Metadata={
 title:{default:'AgroPulse — Suv hisobda. Qaror aniq.',template:'%s | AgroPulse'},
 description:'AgroPulse — O‘zbekistonda sug‘orish suvini o‘lchashdan asosli qarorgacha bo‘lgan AI va IoT suv boshqaruvi ekotizimi konsepsiyasi. Demo platforma va rivojlanish rejasi.',
 applicationName:'AgroPulse',
 keywords:['AgroPulse','suv boshqaruvi','irrigatsiya','suv o‘lchash','qishloq xo‘jaligi','IoT','O‘zbekiston'],
 icons:{icon:'/brand/icon.png'},
 openGraph:{type:'website',locale:'uz_UZ',siteName:'AgroPulse',title:'AgroPulse — Suv hisobda. Qaror aniq.',description:'Suv o‘lchovidan raqamli qarorgacha. AgroPulse’ning texnologik konsepsiyasi va demo platformasi.'},
 twitter:{card:'summary',title:'AgroPulse — Suv hisobda. Qaror aniq.',description:'AI va IoT asosidagi suv boshqaruvi konsepsiyasi.'},
 robots:{index:process.env.NEXT_PUBLIC_SITE_PUBLISHED==='true',follow:process.env.NEXT_PUBLIC_SITE_PUBLISHED==='true'},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="uz"><body><LanguageProvider><SiteNav/><main id="asosiy-kontent">{children}</main><Footer/></LanguageProvider></body></html>}
