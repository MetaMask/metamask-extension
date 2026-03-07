import { getMessage } from '../../shared/modules/i18n';
import en from '../../app/_locales/en/messages.json';

const enMessages = en;

export const enLocale = enMessages;

export function tEn(key: string, substitutions: string[] = []): string {
  const result = getMessage<string>('en', enMessages, key, substitutions);
  if (!result) {
    throw new Error(`Missing i18n key: "${key}"`);
  }
  return result;
}
