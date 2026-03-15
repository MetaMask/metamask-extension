export function createCtaMessage(ctaMessageKey: string) {
  return () => ({ ctaMessageKey });
}
