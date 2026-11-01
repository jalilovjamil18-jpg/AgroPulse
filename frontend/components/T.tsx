'use client';
import { useLanguage } from '@/components/LanguageProvider';
/** Render translated JSX copy through React, not by mutating React-owned DOM nodes. */
export default function T({ text }: { text: string }) {
  const { t } = useLanguage();
  const leading = text.match(/^\s*/)?.[0] ?? '';
  const trailing = text.match(/\s*$/)?.[0] ?? '';
  const core = text.trim();
  return <>{leading}{core ? t(core) : ''}{trailing}</>;
}
