/** Enums de identidade / consentimento LGPD (§6.1). */
export const UserStatus = {
  PendingVerification: 'pending_verification',
  Active: 'active',
  Suspended: 'suspended',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** Propósitos de consentimento versionado (§1.2 / §6.1). Perfilamento exige opt-in explícito. */
export const ConsentPurpose = {
  Marketing: 'marketing',
  Profiling: 'profiling',
  Analytics: 'analytics',
} as const;
export type ConsentPurpose = (typeof ConsentPurpose)[keyof typeof ConsentPurpose];

/** Idade mínima legal — restrição inegociável (§1.2). Validada SEMPRE no servidor. */
export const MINIMUM_AGE = 18;
