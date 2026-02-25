import { getMessage } from '../../shared/modules/i18n';
import en from '../../app/_locales/en/messages.json';

const enMessages = en;

export const enLocale = enMessages;

export function tEn(key: string, substitutions: string[] = []): string | null {
  return getMessage('en', enMessages, key, substitutions);
}
