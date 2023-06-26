import { getAccountNameErrorMessage } from './accounts';

const mockAccounts = [{ name: 'Account 1' }, { name: 'Account 2' }];

const mockLocalization = { t: jest.fn().mockReturnValue('Account') };

describe('Accounts', () => {
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
