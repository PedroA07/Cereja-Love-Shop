import { isValidCpf, maskCpf, normalizeCpf } from './cpf.util';

describe('cpf.util', () => {
  it('aceita CPFs válidos (com e sem máscara)', () => {
    expect(isValidCpf('390.533.447-05')).toBe(true);
    expect(isValidCpf('39053344705')).toBe(true);
    expect(isValidCpf('111.444.777-35')).toBe(true);
  });

  it('rejeita dígitos verificadores errados', () => {
    expect(isValidCpf('390.533.447-00')).toBe(false);
    expect(isValidCpf('12345678900')).toBe(false);
  });

  it('rejeita sequências repetidas e tamanhos inválidos', () => {
    expect(isValidCpf('000.000.000-00')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
  });

  it('normaliza e mascara para exibição discreta', () => {
    expect(normalizeCpf('390.533.447-05')).toBe('39053344705');
    expect(maskCpf('390.533.447-05')).toBe('***.533.***-**');
  });
});
