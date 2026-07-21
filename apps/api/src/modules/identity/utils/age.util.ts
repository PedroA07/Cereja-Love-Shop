import { MINIMUM_AGE } from '@cereja/shared-types';

/**
 * Cálculo de idade e verificação de maioridade — SEMPRE no servidor (§1.2).
 * A partir de `birth_date`, nunca de um flag do cliente.
 */
export function calculateAge(birthDate: Date, reference: Date = new Date()): number {
  let age = reference.getFullYear() - birthDate.getFullYear();
  const monthDiff = reference.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isAdult(birthDate: Date, reference: Date = new Date()): boolean {
  return calculateAge(birthDate, reference) >= MINIMUM_AGE;
}
