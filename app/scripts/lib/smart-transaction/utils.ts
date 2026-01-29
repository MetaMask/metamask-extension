import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import {
  CLIENT_ID_EXTENSION_CHROME,
  CLIENT_ID_EXTENSION_FIREFOX,
} from '../../../../shared/constants/smartTransactions';
import { getPlatform } from '../util';

export const getClientForTransactionMetadata = (): string =>
  getPlatform() === PLATFORM_FIREFOX
    ? CLIENT_ID_EXTENSION_FIREFOX
    : CLIENT_ID_EXTENSION_CHROME;
