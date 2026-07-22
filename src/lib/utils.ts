import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let cachedCurrency = 'ILS';
export function setCurrency(currency: string) {
  cachedCurrency = currency || 'ILS';
}

const currencySymbols: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
  JOD: 'JD',
};

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currencySymbols[cachedCurrency] || '';
  return `${formatted} ${symbol}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function generateNumber(prefix: string, count: number): string {
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

export function validateDates(start: Date, end: Date): boolean {
  return new Date(start) < new Date(end);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getPeriodLabel(start: Date, frequency: string, index: number, freqConfig?: Record<string, number>): string {
  const d = addMonths(start, index * getFrequencyMonths(frequency, freqConfig));
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export function getFrequencyMonths(frequency: string, freqConfig?: Record<string, number>): number {
  if (freqConfig && frequency in freqConfig) return freqConfig[frequency];
  switch (frequency) {
    case 'monthly': return 1;
    case 'bimonthly': return 2;
    case 'quarterly': return 3;
    case 'semiannual': return 6;
    case 'annual': return 12;
    case 'one_time': return 0;
    default: return 1;
  }
}

export function getFrequencyCount(start: Date, end: Date, frequency: string, freqConfig?: Record<string, number>): number {
  if (frequency === 'one_time') return 1;
  const months = getFrequencyMonths(frequency, freqConfig);
  const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, Math.floor(diffMonths / months) + 1);
}

export interface ContractDueScheduleItem {
  index: number;
  dueDate: Date;
  amount: number;
  periodLabel: string;
}

export function calculateContractDueSchedule(
  baseDate: Date,
  endDate: Date,
  rentAmount: number,
  paymentFrequency: string,
  count: number,
  commitmentTiming?: string,
  freqConfig?: Record<string, number>
): ContractDueScheduleItem[] {
  const months = getFrequencyMonths(paymentFrequency, freqConfig);
  const isEndTiming = commitmentTiming === 'end';
  const schedule: ContractDueScheduleItem[] = [];

  const endNoTime = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));

  for (let i = 0; i < count; i++) {
    let dueDate: Date;
    if (months === 0) {
      dueDate = new Date(endNoTime);
    } else if (isEndTiming) {
      const nextCycleStart = addMonths(baseDate, (i + 1) * months);
      dueDate = addDays(nextCycleStart, -1);
    } else {
      dueDate = addMonths(baseDate, i * months);
    }

    const dueDateNoTime = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));

    if (dueDateNoTime > endNoTime) continue;

    const periodLabel = months === 0
      ? 'دفعة واحدة'
      : getPeriodLabel(baseDate, paymentFrequency, i, freqConfig);

    schedule.push({
      index: i,
      dueDate: dueDateNoTime,
      amount: rentAmount,
      periodLabel,
    });
  }

  return schedule;
}
