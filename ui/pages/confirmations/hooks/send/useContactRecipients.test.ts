import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as selectors from '../../../../selectors';
import * as SendContext from '../../context/send';
import { useContactRecipients } from './useContactRecipients';
import * as useSendTypeModule from './useSendType';
import { useSendType } from './useSendType';

jest.mock('./useSendType');
jest.mock('../../../../selectors');
jest.mock('./useAccountAddressSeedIconMap', () => ({
  useAccountAddressSeedIconMap: jest.fn().mockReturnValue({
    accountAddressSeedIconMap: new Map(),
  }),
}));
jest.mock('ethers/lib/utils');
jest.mock('@metamask/bridge-controller');

const mockUseSendType = jest.spyOn(useSendTypeModule, 'useSendType');
const mockGetCompleteAddressBook = jest.spyOn(
  selectors,
  'getCompleteAddressBook',
);
const mockIsEvmAddress = jest.mocked(isEvmAddress);

describe('useContactRecipients', () => {
  const mockAddressBookEntries = [
    {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'John Doe',
      chainId: '0x1',
    },
    {
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      name: 'Jane Smith',
      chainId: 'sol:101',
    },
    {
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'Bob Wilson',
      chainId: '0x89',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCompleteAddressBook.mockReturnValue(mockAddressBookEntries);
  });

  it('returns EVM contacts filtered by chainId when isEvmSendType is true', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      chainId: '0x1',
    } as unknown as SendContext.SendContextType);
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockIsEvmAddress.mockImplementation((address) => address.startsWith('0x'));

    const { result } = renderHookWithProvider(
      () => useContactRecipients(),
      mockState,
    );

    expect(result.current).toEqual([
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        contactName: 'John Doe',
        isContact: true,
        seedIcon: undefined,
      },
    ]);
  });

  it('returns empty array when isEvmSendType is false', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: false,
      isSolanaSendType: false,
      isBitcoinSendType: false,
    } as unknown as ReturnType<typeof useSendType>);

    const { result } = renderHookWithProvider(
      () => useContactRecipients(),
      mockState,
    );

    expect(result.current).toEqual([]);
  });

  it('returns empty array when address book is empty', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockGetCompleteAddressBook.mockReturnValue([]);

    const { result } = renderHookWithProvider(
      () => useContactRecipients(),
      mockState,
    );

    expect(result.current).toEqual([]);
  });

  it('filters out non-EVM addresses when isEvmSendType is true', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      chainId: '0x1',
    } as unknown as SendContext.SendContextType);
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);
    mockIsEvmAddress.mockImplementation(
      (address) => address === '0x1234567890abcdef1234567890abcdef12345678',
    );

    const { result } = renderHookWithProvider(
      () => useContactRecipients(),
      mockState,
    );

    expect(result.current).toEqual([
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        contactName: 'John Doe',
        isContact: true,
      },
    ]);
  });

  it('calls useSendType hook', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: false,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);

    renderHookWithProvider(() => useContactRecipients(), mockState);

    expect(mockUseSendType).toHaveBeenCalledTimes(1);
  });

  it('calls getCompleteAddressBook selector', () => {
    mockUseSendType.mockReturnValue({
      isEvmSendType: true,
      isSolanaSendType: false,
    } as unknown as ReturnType<typeof useSendType>);

    renderHookWithProvider(() => useContactRecipients(), mockState);

    expect(mockGetCompleteAddressBook).toHaveBeenCalledTimes(1);
  });
});
