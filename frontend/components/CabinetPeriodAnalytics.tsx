'use client';

import {useEffect, useMemo, useState} from 'react';
import {Activity, CalendarDays, ChartNoAxesCombined, RadioTower, Waves} from 'lucide-react';
import {useLanguage} from '@/components/LanguageProvider';
import {apiRequest, type Role} from '@/lib/realApi';

type MonthRow = {
  month: string;
  readings_count: number;
  average_flow_lps: string | null;
  stations_with_readings: number;
};
type PeriodStatistics = {
  demo: false;
  data_source: string;
  period: {type: 'month' | 'year'; year: number; month: number | null; from: string; to: string};
  summary: {
    readings_count: number;
    average_flow_lps: string | null;
    average_level_cm: string | null;
    stations_with_readings: number;
    stations_total: number;
    canals_total: number;
    areas_total: number;
    fields_total: number;
  };
  months: MonthRow[];
  note: string;
};

type Lang = 'uz' | 'ru' | 'en';
const labels = {
  uz: {
    title: 'Oylik va yillik ko‘rsatkichlar',
    year: 'Yil',
    month: 'Oy',
    annual: 'Yillik',
    monthly: 'Oylik',
    apply: 'Ko‘rsatish',
    readings: 'Jami o‘lchovlar',
    averageFlow: 'O‘rtacha oqim',
    stations: 'Ma’lumot kelgan sensorlar',
    canals: 'Kanallar',
    areas: 'Hududlar',
    fields: 'Dalalar',
    monthBreakdown: 'Oylar kesimida',
    period: 'Hisobot davri',
    empty: 'Tanlangan davrda haqiqiy o‘lchovlar topilmadi.',
    noValue: 'Ma’lumot yo‘q',
    source: 'Manba: serverdagi haqiqiy o‘lchovlar',
    note: 'l/s — o‘lchovlar qayd etilgan paytdagi oqim tezligi. Bu jami suv hajmi (m³) emas.',
    error: 'Statistikani yuklashda xatolik',
    loading: 'Ma’lumot yuklanmoqda...',
    count: 'O‘lchov',
    coverage: 'qamrov',
  },
  ru: {
    title: 'Месячные и годовые показатели',
    year: 'Год',
    month: 'Месяц',
    annual: 'За год',
    monthly: 'За месяц',
    apply: 'Показать',
    readings: 'Всего измерений',
    averageFlow: 'Средний расход',
    stations: 'Датчики с данными',
    canals: 'Каналы',
    areas: 'Участки',
    fields: 'Поля',
    monthBreakdown: 'По месяцам',
    period: 'Отчётный период',
    empty: 'За выбранный период реальных измерений нет.',
    noValue: 'Нет данных',
    source: 'Источник: реальные измерения на сервере',
    note: 'л/с — мгновенная скорость потока во время измерения, а не общий объём м³.',
    error: 'Не удалось загрузить статистику',
    loading: 'Загрузка данных...',
    count: 'Измерений',
    coverage: 'охват',
  },
  en: {
    title: 'Monthly and yearly indicators',
    year: 'Year',
    month: 'Month',
    annual: 'Yearly',
    monthly: 'Monthly',
    apply: 'Apply',
    readings: 'Total readings',
    averageFlow: 'Average flow',
    stations: 'Stations with readings',
    canals: 'Canals',
    areas: 'Areas',
    fields: 'Fields',
    monthBreakdown: 'By month',
    period: 'Reporting period',
    empty: 'No real measurements were found for this period.',
    noValue: 'No data',
    source: 'Source: actual server measurements',
    note: 'l/s is the instantaneous flow rate at measurement time, not total water volume in m³.',
    error: 'Could not load statistics',
    loading: 'Loading data...',
    count: 'Readings',
    coverage: 'coverage',
  },
};

const currentYear = new Date().getFullYear();
const monthNames = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function formatNumber(value: number | string | null, lang: Lang, digits = 0) {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return new Intl.NumberFormat(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', {
    maximumFractionDigits: digits,
  }).format(numeric);
}

export default function CabinetPeriodAnalytics({token, role}: {token: string; role: Role}) {
  const {language} = useLanguage();
  const lang: Lang = language === 'ru' || language === 'en' ? language : 'uz';
  const t = labels[lang];
  const [mode, setMode] = useState<'year' | 'month'>('year');
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [applied, setApplied] = useState({mode: 'year' as 'year' | 'month', year: String(currentYear), month: String(new Date().getMonth() + 1)});
  const [data, setData] = useState<PeriodStatistics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    const params = new URLSearchParams({year: applied.year});
    if (applied.mode === 'month') params.set('month', applied.month);
    apiRequest<PeriodStatistics>(`/dashboard/statistics/?${params.toString()}`, token)
      .then(result => { if (active) setData(result); })
      .catch(err => { if (active) { setData(null); setError(err instanceof Error ? err.message : t.error); } })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [token, applied, t.error]);

  const maxReadings = useMemo(
    () => Math.max(1, ...(data?.months ?? []).map(item => item.readings_count)),
    [data],
  );
  const years = Array.from({length: Math.max(1, currentYear - 2019)}, (_, index) => currentYear - index);
  const hasReadings = (data?.summary.readings_count ?? 0) > 0;

  return (
    <section className="ap-period" aria-label={t.title}>
      <header className="ap-period-head">
        <div>
          <span className="ap-real-kicker">AGROPULSE / QORAKO‘L / REAL DATA</span>
          <h2><ChartNoAxesCombined size={22}/>{t.title}</h2>
          <p>{t.source}</p>
        </div>
        <form className="ap-period-controls" onSubmit={event => {
          event.preventDefault();
          setApplied({mode, year, month});
        }}>
          <div className="ap-period-mode" role="group" aria-label={t.period}>
            <button type="button" className={mode === 'year' ? 'selected' : ''} onClick={() => setMode('year')}>{t.annual}</button>
            <button type="button" className={mode === 'month' ? 'selected' : ''} onClick={() => setMode('month')}>{t.monthly}</button>
          </div>
          <label>{t.year}
            <select value={year} onChange={event => setYear(event.target.value)}>
              {years.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          {mode === 'month' && <label>{t.month}
            <select value={month} onChange={event => setMonth(event.target.value)}>
              {monthNames[lang].map((name, index) => <option key={index + 1} value={index + 1}>{name}</option>)}
            </select>
          </label>}
          <button type="submit" className="ap-period-apply" disabled={busy}><CalendarDays size={15}/>{t.apply}</button>
        </form>
      </header>

      {busy && <p className="ap-role-muted" role="status">{t.loading}</p>}
      {error && <p className="ap-real-message error" role="alert">{t.error}: {error}</p>}
      {data && <>
        <div className="ap-period-kpis">
          <article><Activity size={20}/><small>{t.readings}</small><strong>{formatNumber(data.summary.readings_count, lang)}</strong></article>
          <article><Waves size={20}/><small>{t.averageFlow}</small><strong>{formatNumber(data.summary.average_flow_lps, lang, 3)} <em>{data.summary.average_flow_lps !== null ? 'l/s' : ''}</em></strong></article>
          <article><RadioTower size={20}/><small>{t.stations}</small><strong>{formatNumber(data.summary.stations_with_readings, lang)} <em>/ {formatNumber(data.summary.stations_total, lang)}</em></strong></article>
          <article><Waves size={20}/><small>{t.canals}</small><strong>{formatNumber(data.summary.canals_total, lang)}</strong></article>
        </div>
        <div className="ap-period-detail">
          <div className="ap-period-period">
            <span>{t.period}</span>
            <strong>{data.period.type === 'year' ? data.period.year : `${data.period.year}-${String(data.period.month).padStart(2, '0')}`}</strong>
            <small>{t.areas}: {formatNumber(data.summary.areas_total, lang)} · {t.fields}: {formatNumber(data.summary.fields_total, lang)}</small>
          </div>
          {data.period.type === 'year' && <div className="ap-period-months">
            <h3>{t.monthBreakdown}</h3>
            <div className="ap-period-chart">
              {data.months.map(item => {
                const monthIndex = Number(item.month.slice(5, 7)) - 1;
                const height = item.readings_count ? Math.max(5, item.readings_count / maxReadings * 100) : 0;
                return <div className="ap-period-column" key={item.month} title={`${item.month}: ${item.readings_count} ${t.count}`}>
                  <div className="ap-period-bar-track"><i style={{height: `${height}%`}}/></div>
                  <span>{monthNames[lang][monthIndex]}</span>
                  <small>{formatNumber(item.readings_count, lang)}</small>
                </div>;
              })}
            </div>
          </div>}
        </div>
        {!hasReadings && <p className="ap-real-empty">{t.empty}</p>}
        <p className="ap-period-note">{data.note}</p>
      </>}
    </section>
  );
}
