import { LoaderFunctionArgs } from 'react-router-dom';

/**
 * Factory to create a loader for a specific CTA message key.
 * @param ctaMessageKey - The CTA message key to provide
 * @returns Loader function
 */
export function createCtaMessage(ctaMessageKey: string) {
  return () => ({ ctaMessageKey });
}
