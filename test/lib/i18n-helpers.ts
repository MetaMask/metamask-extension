import type { I18NMessageDict } from '../../shared/modules/i18n';
import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import en from '../../app/_locales/en/messages.json';

const enMessages = en as unknown as I18NMessageDict;

export const enLocale = enMessages;

export function tEn(key: string, substitutions: string[] = []): string {
  return getMessage('en', enMessages, key, substitutions) as string;
}
