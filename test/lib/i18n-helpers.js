import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import * as en from '../../app/_locales/en/messages.json';

export const enLocale = en;

export function tEn(key, substitutions = []) {
  return getMessage('en', en, key, substitutions);
}
