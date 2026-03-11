import { BadRequestException } from '@nestjs/common';

function parseDateInput(date?: string): Date {
  if (!date) {
    return new Date();
  }

  const [year, month, day] = date.split('-').map(Number);

  if (!year || !month || !day) {
    throw new BadRequestException('La fecha debe usar el formato YYYY-MM-DD.');
  }

  return new Date(year, month - 1, day);
}

export function getDailyRange(date?: string): { start: Date; end: Date } {
  const target = parseDateInput(date);
  target.setHours(0, 0, 0, 0);

  const end = new Date(target);
  end.setDate(end.getDate() + 1);

  return { start: target, end };
}

export function getWeeklyRange(date?: string): { start: Date; end: Date } {
  const target = parseDateInput(date);
  target.setHours(0, 0, 0, 0);

  const day = target.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(target);
  start.setDate(start.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
}

export function getMonthlyRange(date?: string): { start: Date; end: Date } {
  const target = parseDateInput(date);
  const start = new Date(target.getFullYear(), target.getMonth(), 1);
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 1);

  return { start, end };
}
