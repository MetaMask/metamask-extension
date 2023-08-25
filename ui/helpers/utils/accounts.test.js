import {
  GOERLI_DISPLAY_NAME,
  LINEA_GOERLI_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';
import { BackgroundColor } from '../constants/design-system';
import { getAccountNameErrorMessage, getAvatarNetworkColor } from './accounts';

const mockAccounts = [{ name: 'Account 1' }, { name: 'Account 2' }];

const mockLocalization = { t: jest.fn().mockReturnValue('Account') };

describe('Accounts', () => {
  describe('#getAccountNameErrorMessage', () => {
    it('does not allow duplicate names', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'Account 2',
        'Account 3',
      );
      expect(isValidAccountName).toBe(false);
    });

    it('does not allow reserved name patterns', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'Account 7',
        'Account 3',
      );
      expect(isValidAccountName).toBe(false);
    });

    it('does not allow reserved name patterns in lowercase', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'account 7',
        'Account 3',
      );
      expect(isValidAccountName).toBe(false);
    });

    it('allows proposed name in lowercase', () => {
      const { isValidAccountName } = getAccountNameErrorMessage(
        mockAccounts,
        mockLocalization,
        'account 3',
        'Account 3',
      );
      expect(isValidAccountName).toBe(true);
    });
  });

  describe('#getAvatarNetworkColor', () => {
    it('should return goerli', () => {
      expect(getAvatarNetworkColor(GOERLI_DISPLAY_NAME)).toStrictEqual(
        BackgroundColor.goerli,
      );
    });
    it('should return lineaGoerli', () => {
      expect(getAvatarNetworkColor(LINEA_GOERLI_DISPLAY_NAME)).toStrictEqual(
        BackgroundColor.lineaGoerli,
      );
    });
    it('should return sepolia', () => {
      expect(getAvatarNetworkColor(SEPOLIA_DISPLAY_NAME)).toStrictEqual(
        BackgroundColor.sepolia,
      );
    });
    it('should return undefined', () => {
      expect(getAvatarNetworkColor(MAINNET_DISPLAY_NAME)).toStrictEqual(
        undefined,
      );
    });
  });
});
