import * as en from '../../app/_locales/en/messages.json';
import { getMessage } from '../../ui/helpers/utils/i18n-helper';

export function tEn(key) {
  return getMessage('en', en, key);
}
