import { KeyringTypes } from '@metamask/keyring-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { getMetaMaskHdKeyrings } from '../../selectors';
import { getInternalAccounts } from '../../selectors/accounts';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import mockState from '../../../test/data/mock-state.json';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';
import { useHdKeyringsWithSnapAccounts } from './useHdKeyringsWithSnapAccounts';

const mockHdAccount = createMockInternalAccount({
  address: '',
  name: 'Account 1',
});

const mockHdAccount2 = createMockInternalAccount({
  address: '',
  name: 'Account 2',
});

const mockFirstPartySnapAccount = createMockInternalAccount({
  address: '',
  name: 'First Party Snap Account',
  options: {
    entropySource: 'keyring1',
  },
  keyringType: KeyringTypes.snap,
});

const mockSnapAccount2 = createMockInternalAccount({
  address: '',
  name: 'Second Party Snap Account',
  options: {},
  keyringType: KeyringTypes.snap,
});

const mockHdKeyring = {
  type: KeyringTypes.hd,
  accounts: [mockHdAccount.address],
  metadata: {
    id: 'keyring1',
  },
};

const mockHdKeyring2 = {
  type: KeyringTypes.hd,
  accounts: [mockHdAccount2.address],
  metadata: {
    id: 'keyring2',
  },
};

jest.mock('../../selectors', () => ({
  ...jest.requireActual('../../selectors'),
  getMetaMaskHdKeyrings: jest.fn(),
}));

jest.mock('../../selectors/accounts', () => ({
  ...jest.requireActual('../../selectors/accounts'),
  getInternalAccounts: jest.fn(),
}));

jest.mock('../../../shared/lib/snaps/snaps', () => ({
  ...jest.requireActual('../../../shared/lib/snaps/snaps'),
  isSnapPreinstalled: jest.fn(),
}));

const mockGetMetaMaskHdKeyrings = getMetaMaskHdKeyrings as unknown as jest.Mock;
const mockGetInternalAccounts = getInternalAccounts as unknown as jest.Mock;
const mockIsSnapPreinstalled = isSnapPreinstalled as unknown as jest.Mock;

describe('useHdKeyringsWithSnapAccounts', () => {
  beforeEach(() => {
    mockGetMetaMaskHdKeyrings.mockReturnValue([mockHdKeyring, mockHdKeyring2]);
    mockGetInternalAccounts.mockReturnValue([
      mockHdAccount,
      mockHdAccount2,
      mockFirstPartySnapAccount,
      mockSnapAccount2,
    ]);
    mockIsSnapPreinstalled.mockReturnValue(true);
  });

  it('includes snap accounts that have a matching entropy source', () => {
    const { result } = renderHookWithProvider(
      () => useHdKeyringsWithSnapAccounts(),
      mockState,
    );

    const expectedResult = [
      {
        ...mockHdKeyring,
        accounts: [mockHdAccount.address, mockFirstPartySnapAccount.address],
      },
      {
        ...mockHdKeyring2,
        accounts: [mockHdAccount2.address],
      },
    ];

    expect(result.current).toEqual(expectedResult);
    expect(getMetaMaskHdKeyrings).toHaveBeenCalled();
    expect(getInternalAccounts).toHaveBeenCalled();
  });

  it('handles empty keyrings', () => {
    mockGetMetaMaskHdKeyrings.mockReturnValue([]);
    mockGetInternalAccounts.mockReturnValue([]);

    const { result } = renderHookWithProvider(
      () => useHdKeyringsWithSnapAccounts(),
      mockState,
    );

    expect(result.current).toEqual([]);
  });

  it('does not include snap accounts that do not have a matching entropy source', () => {
    mockGetInternalAccounts.mockReturnValue([
      mockHdAccount,
      mockHdAccount2,
      mockSnapAccount2,
    ]);

    const { result } = renderHookWithProvider(
      () => useHdKeyringsWithSnapAccounts(),
      mockState,
    );

    const expectedResult = [
      {
        ...mockHdKeyring,
        accounts: [mockHdAccount.address],
      },
      {
        ...mockHdKeyring2,
        accounts: [mockHdAccount2.address],
      },
    ];

    expect(result.current).toEqual(expectedResult);
  });
});
