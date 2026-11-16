import { BadRequestException } from '@nestjs/common';

export function endOfUtcDay(input: string): Date {
  const dateOnly = input.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    throw new BadRequestException('dueDate must be a calendar date');
  }

  const [year, month, day] = dateOnly.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new BadRequestException('dueDate must be a calendar date');
  }

  return utc;
}
