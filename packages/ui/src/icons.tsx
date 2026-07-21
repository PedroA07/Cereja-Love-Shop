import * as React from 'react';

/**
 * Ícones autorais do Cereja Love Shop (§6.9). Sem bibliotecas externas e sem
 * emojis: SVG desenhados à mão, 24×24, herdando `currentColor`. Ícones de
 * traço usam stroke 1.5; o CherryMark (logo) é preenchido.
 */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

function Stroke({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Marca da Cereja — duas cerejas com hastes e folha. Logo/glyph. */
export function CherryMark({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M7 12C8 7 10 4.6 12.5 3.6"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M16.2 10.6C15 6.6 13.6 4.6 12.5 3.6"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M12.5 3.6c1.8-1.6 4.4-1.4 6 0.2-1.8 1.4-4.4 1.2-6-0.2Z"
        fill="currentColor"
      />
      <circle cx="7" cy="16.2" r="4.4" fill="currentColor" />
      <circle cx="16.2" cy="15" r="4.4" fill="currentColor" />
    </svg>
  );
}

/** Escudo com coração — privacidade / proteção de dados. */
export function IconShieldHeart(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3 4.5 6v5.5c0 4.2 3 7.4 7.5 9 4.5-1.6 7.5-4.8 7.5-9V6L12 3Z" />
      <path d="M12 14.4c-2.6-1.5-3.4-2.9-3.4-4.1a1.9 1.9 0 0 1 3.4-1.1 1.9 1.9 0 0 1 3.4 1.1c0 1.2-.8 2.6-3.4 4.1Z" />
    </Stroke>
  );
}

/** Caixa/pacote lacrado — entrega sigilosa, embalagem discreta. */
export function IconDiscreetPackage(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3 20 7v10l-8 4-8-4V7l8-4Z" />
      <path d="M4 7l8 4 8-4" />
      <path d="M12 11v10" />
      <path d="M8.5 5 16 9" />
    </Stroke>
  );
}

/** Selo "18+" — ambiente exclusivo para adultos. */
export function IconEighteenPlus(props: IconProps) {
  return (
    <svg
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M7.6 8.4v7.2M7.6 8.4H6.4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.4 12a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Zm0 0a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M16.6 9.4v3.4M14.9 11.1h3.4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Porta com seta — botão de saída rápida (discrição, §1.2). */
export function IconQuickExit(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8" />
      <path d="M10 12h11" />
      <path d="M18 8.5 21.5 12 18 15.5" />
    </Stroke>
  );
}

/** Cadeado — dados protegidos / criptografia. */
export function IconLock(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <path d="M12 14.5v2.5" />
    </Stroke>
  );
}

/** Olho — mostrar mídia sensível (toggle do thumbnail discreto). */
export function IconEye(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Stroke>
  );
}

/** Olho cortado — ocultar mídia sensível (estado padrão discreto). */
export function IconEyeOff(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M9.9 5.7A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.4 3.2" />
      <path d="M6.3 7.8A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 3.9-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M4 4l16 16" />
    </Stroke>
  );
}
