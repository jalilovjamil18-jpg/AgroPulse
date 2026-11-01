'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import type { Language } from '@/lib/i18n';

type Option = { code: Language; short: string; label: string; nativeLabel: string };

const languages: readonly Option[] = [
  { code: 'uz', short: 'UZ', label: 'O‘zbekcha', nativeLabel: 'O‘zbekcha' },
  { code: 'ru', short: 'RU', label: 'Русский', nativeLabel: 'Русский' },
  { code: 'en', short: 'EN', label: 'English', nativeLabel: 'English' },
];

/** AgroPulse-designed dropdown, shared by both header variants.
 * The trigger (including its arrow) is one real button, not a narrow native select.
 */
export default function LanguageSwitcher({onOpenChange}: {onOpenChange?: (open: boolean) => void}) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = 'ap-lang-menu';
  const selected = languages.find(option => option.code === language) ?? languages[0];

  function changeOpen(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) changeOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        changeOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // Only attach listeners while the menu is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openAndFocus(index: number) {
    changeOpen(true);
    window.requestAnimationFrame(() => itemRefs.current[index]?.focus());
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openAndFocus(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAndFocus(languages.length - 1);
    }
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const move = event.key === 'ArrowDown' ? 1 : -1;
      itemRefs.current[(index + move + languages.length) % languages.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      itemRefs.current[event.key === 'Home' ? 0 : languages.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      changeOpen(false);
    }
  }

  function chooseLanguage(code: Language) {
    if (code !== language) setLanguage(code);
    changeOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={'ap-lang-control' + (open ? ' ap-lang-control--open' : '')} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="ap-lang-trigger"
        aria-label={t('Tilni tanlang') + ': ' + selected.nativeLabel}
        title={t('Tilni tanlang')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => changeOpen(!open)}
        onKeyDown={handleTriggerKeyDown}
      >
        <Globe2 size={17} aria-hidden="true" />
        <span className="ap-lang-code">{selected.short}</span>
        <ChevronDown size={15} aria-hidden="true" className={'ap-lang-chevron' + (open ? ' ap-lang-chevron--up' : '')} />
      </button>
      {open && (
        <div className="ap-lang-popover" id={menuId} role="menu" aria-label={t('Tilni tanlang')}>
          <div className="ap-lang-popover-label">{t('Tilni tanlang')}</div>
          {languages.map((option, index) => (
            <button
              key={option.code}
              type="button"
              ref={el => { itemRefs.current[index] = el; }}
              className={'ap-lang-option' + (language === option.code ? ' ap-lang-option--selected' : '')}
              role="menuitemradio"
              aria-checked={language === option.code}
              lang={option.code}
              onClick={() => chooseLanguage(option.code)}
              onKeyDown={event => handleOptionKeyDown(event, index)}
            >
              <span className="ap-lang-option-short" aria-hidden="true">{option.short}</span>
              <span className="ap-lang-option-label">{option.label}</span>
              {language === option.code && <Check size={16} className="ap-lang-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
