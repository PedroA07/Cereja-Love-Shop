import { calculateAge, isAdult } from './age.util';

describe('age.util', () => {
  const today = new Date('2026-07-21T12:00:00Z');

  it('calcula idade considerando o mês/dia', () => {
    expect(calculateAge(new Date('2000-07-21'), today)).toBe(26);
    expect(calculateAge(new Date('2000-07-22'), today)).toBe(25); // ainda não fez aniversário
  });

  it('bloqueia menores de 18 (validação servidor, §1.2)', () => {
    expect(isAdult(new Date('2009-07-20'), today)).toBe(false); // 16
    expect(isAdult(new Date('2008-07-22'), today)).toBe(false); // 17, faz 18 amanhã
  });

  it('libera quem tem 18 ou mais', () => {
    expect(isAdult(new Date('2008-07-21'), today)).toBe(true); // faz 18 hoje
    expect(isAdult(new Date('1990-01-01'), today)).toBe(true);
  });
});
