import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import * as en from '../../app/_locales/en/messages.json';

export const enLocale = en;

export function tEn(key: string, substitutions: string[] = []): string {
  return getMessage('en', en, key, substitutions) as string;
}
