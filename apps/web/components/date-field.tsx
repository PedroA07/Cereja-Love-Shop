'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconCalendar, IconChevronLeft, IconChevronRight, cn } from '@cereja/ui';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatBr(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Interpreta "dd/mm/aaaa" digitado; retorna Date válida ou null. */
function parseBr(text: string): Date | null {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

/** Máscara progressiva: só dígitos, insere as barras automaticamente. */
function maskBr(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

export interface DateFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  /** Ano mais antigo selecionável (padrão 1920). */
  minYear?: number;
  /** Ano mais recente selecionável (padrão: ano atual). */
  maxYear?: number;
}

/**
 * Campo de data autoral do Cereja Love Shop: digitação direta (dd/mm/aaaa) e
 * calendário com navegação por mês e seletor de mês/ano. Emite a data em
 * ISO (aaaa-mm-dd) num input oculto, para o formulário.
 */
export function DateField({ name, label, required, minYear = 1920, maxYear }: DateFieldProps) {
  const today = useMemo(() => new Date(), []);
  const topYear = maxYear ?? today.getFullYear();

  const [selected, setSelected] = useState<Date | null>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  // Mês em exibição no calendário; começa ~25 anos atrás (típico p/ nascimento)
  const [view, setView] = useState(() => new Date(topYear - 25, 0, 1));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function commit(date: Date) {
    setSelected(date);
    setText(formatBr(date));
    setView(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function onType(raw: string) {
    const masked = maskBr(raw);
    setText(masked);
    const parsed = parseBr(masked);
    if (parsed) {
      setSelected(parsed);
      setView(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    } else {
      setSelected(null);
    }
  }

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = topYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [topYear, minYear]);

  const grid = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // volta ao domingo
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  function shiftMonth(delta: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  return (
    <div className="flex flex-col gap-1.5" ref={rootRef}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          value={text}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setOpen(true)}
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          autoComplete="off"
          className={cn(
            'h-11 w-full rounded-md border border-nude bg-offwhite pl-3 pr-10 font-sans text-[15px] text-ink',
            'placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja',
          )}
        />
        {/* input oculto com o valor ISO para o formulário */}
        <input type="hidden" name={name} value={selected ? toIso(selected) : ''} />
        <button
          type="button"
          aria-label="Abrir calendário"
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-vinho hover:text-cereja"
        >
          <IconCalendar size={20} />
        </button>

        {open && (
          <div className="absolute z-30 mt-2 w-[19rem] rounded-lg border border-nude/50 bg-offwhite p-3 shadow-soft">
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() => shiftMonth(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-vinho hover:bg-creme"
              >
                <IconChevronLeft size={18} />
              </button>
              <select
                aria-label="Mês"
                value={view.getMonth()}
                onChange={(e) => setView(new Date(view.getFullYear(), Number(e.target.value), 1))}
                className="h-8 flex-1 rounded-md border border-nude bg-offwhite px-2 font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
              >
                {MONTHS.map((mo, i) => (
                  <option key={mo} value={i}>{mo}</option>
                ))}
              </select>
              <select
                aria-label="Ano"
                value={view.getFullYear()}
                onChange={(e) => setView(new Date(Number(e.target.value), view.getMonth(), 1))}
                className="h-8 w-24 rounded-md border border-nude bg-offwhite px-2 font-sans text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() => shiftMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-vinho hover:bg-creme"
              >
                <IconChevronRight size={18} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-ink/50">
              {WEEKDAYS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((d) => {
                const inMonth = d.getMonth() === view.getMonth();
                const isSelected = selected && toIso(d) === toIso(selected);
                const isToday = toIso(d) === toIso(today);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => {
                      commit(d);
                      setOpen(false);
                    }}
                    className={cn(
                      'h-9 rounded-md text-sm transition-colors',
                      inMonth ? 'text-ink hover:bg-creme' : 'text-ink/30 hover:bg-creme/50',
                      isToday && !isSelected && 'ring-1 ring-nude',
                      isSelected && 'bg-cereja text-offwhite hover:bg-vinho',
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
