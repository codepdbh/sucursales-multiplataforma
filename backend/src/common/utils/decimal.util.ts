import { Prisma } from '@prisma/client';

export function toDecimal(
  value: number | string | Prisma.Decimal,
): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function decimalToNumber(
  value?: Prisma.Decimal | number | string | null,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return new Prisma.Decimal(value).toNumber();
}
