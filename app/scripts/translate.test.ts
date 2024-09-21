import {
  getMessage,
  fetchLocale,
  FALLBACK_LOCALE,
} from '../../shared/modules/i18n';
import { t, updateCurrentLocale } from './translate';

const localeCodeMock = 'te';
const keyMock = 'testKey';
const substitutionsMock = ['a1', 'b2'];
const messageMock = 'testMessage';
const messageMock2 = 'testMessage2';
const alternateLocaleDataMock = { [keyMock]: { message: messageMock2 } };

jest.mock('../../shared/modules/i18n');
jest.mock('../_locales/en/messages.json', () => ({
  [keyMock]: { message: messageMock },
}));

describe('Translate', () => {
  const getMessageMock = getMessage as jest.MockedFunction<typeof getMessage>;
  const fetchLocaleMock = fetchLocale as jest.MockedFunction<
    typeof fetchLocale
  >;

  beforeEach(async () => {
    jest.resetAllMocks();
    await updateCurrentLocale(FALLBACK_LOCALE);
  });

  describe('updateCurrentLocale', () => {
    it('retrieves locale data from shared module', async () => {
      await updateCurrentLocale(localeCodeMock);

      expect(fetchLocale).toHaveBeenCalledTimes(1);
      expect(fetchLocale).toHaveBeenCalledWith(localeCodeMock);
    });

    it('does not retrieve locale data if same locale already set', async () => {
      await updateCurrentLocale(localeCodeMock);
      await updateCurrentLocale(localeCodeMock);

      expect(fetchLocale).toHaveBeenCalledTimes(1);
      expect(fetchLocale).toHaveBeenCalledWith(localeCodeMock);
    });

    it('does not retrieve locale data if fallback locale set', async () => {
      await updateCurrentLocale(localeCodeMock);
      await updateCurrentLocale(FALLBACK_LOCALE);

      expect(fetchLocale).toHaveBeenCalledTimes(1);
      expect(fetchLocale).toHaveBeenCalledWith(localeCodeMock);
    });
  });

  describe('t', () => {
    it('returns value from shared module', () => {
      getMessageMock.mockReturnValue(messageMock);

      expect(t(keyMock, ...substitutionsMock)).toStrictEqual(messageMock);
    });

    it('uses en locale by default', () => {
      getMessageMock.mockReturnValue(messageMock);

      t(keyMock, ...substitutionsMock);

      expect(getMessage).toHaveBeenCalledTimes(1);
      expect(getMessage).toHaveBeenCalledWith(
        FALLBACK_LOCALE,
        { [keyMock]: { message: messageMock } },
        keyMock,
        substitutionsMock,
      );
    });

    it('uses locale passed to updateCurrentLocale if called', async () => {
      (getMessage as jest.MockedFunction<typeof getMessage>).mockReturnValue(
        messageMock,
      );

      fetchLocaleMock.mockResolvedValueOnce(alternateLocaleDataMock);
      await updateCurrentLocale(localeCodeMock);

      t(keyMock, ...substitutionsMock);

      expect(getMessage).toHaveBeenCalledTimes(1);
      expect(getMessage).toHaveBeenCalledWith(
        localeCodeMock,
        alternateLocaleDataMock,
        keyMock,
        substitutionsMock,
      );
    });

    it('returns value from en locale as fallback if current locale returns null', async () => {
      (
        getMessage as jest.MockedFunction<typeof getMessage>
      ).mockReturnValueOnce(null);

      (
        getMessage as jest.MockedFunction<typeof getMessage>
      ).mockReturnValueOnce(messageMock2);

      fetchLocaleMock.mockResolvedValueOnce(alternateLocaleDataMock);
      await updateCurrentLocale(localeCodeMock);

      expect(t(keyMock, ...substitutionsMock)).toStrictEqual(messageMock2);

      expect(getMessage).toHaveBeenCalledTimes(2);
      expect(getMessage).toHaveBeenCalledWith(
        FALLBACK_LOCALE,
        { [keyMock]: { message: messageMock } },
        keyMock,
        substitutionsMock,
      );
      expect(getMessage).toHaveBeenCalledWith(
        localeCodeMock,
        alternateLocaleDataMock,
        keyMock,
        substitutionsMock,
      );
    });
  });
});
