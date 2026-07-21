/**
 * Validação de CPF (§6.1) — dígitos verificadores. Rejeita sequências
 * repetidas (000..., 111...) e formatos inválidos. Guarda-se sempre a versão
 * só-dígitos, criptografada em coluna.
 */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function isValidCpf(input: string): boolean {
  const cpf = normalizeCpf(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  const digits = cpf.split('').map(Number);

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += (digits[i] as number) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
}

/** Máscara para exibição/logs discretos: 390.***.**7-05 → ***.533.***-** */
export function maskCpf(cpf: string): string {
  const n = normalizeCpf(cpf);
  if (n.length !== 11) return '***';
  return `***.${n.slice(3, 6)}.***-**`;
}
