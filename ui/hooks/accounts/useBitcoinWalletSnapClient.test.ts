import { renderHook } from '@testing-library/react-hooks';
import { HandlerType } from '@metamask/snaps-utils';
import { BtcAccountType, BtcMethod } from '@metamask/keyring-api';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { BITCOIN_WALLET_SNAP_ID } from '../../../shared/lib/accounts/bitcoin-wallet-snap';
import {
  handleSnapRequest,
  multichainUpdateBalance,
} from '../../store/actions';
import { useBitcoinWalletSnapClient } from './useBitcoinWalletSnapClient';

jest.mock('../../store/actions', () => ({
  handleSnapRequest: jest.fn(),
  multichainUpdateBalance: jest.fn(),
}));

const mockHandleSnapRequest = handleSnapRequest as jest.Mock;
const mockMultichainUpdateBalance = multichainUpdateBalance as jest.Mock;

describe('useBitcoinWalletSnapClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccount = {
    address: 'tb1q2hjrlnf8kmtt5dj6e49gqzy6jnpe0sj7ty50cl',
    id: '11a33c6b-0d46-43f4-a401-01587d575fd0',
    options: {},
    methods: [BtcMethod.SendMany],
    type: BtcAccountType.P2wpkh,
  };

  it('dispatch a Snap keyring request to create a Bitcoin account', async () => {
    const { result } = renderHook(() => useBitcoinWalletSnapClient());
    const bitcoinWalletSnapClient = result.current;

    mockHandleSnapRequest.mockResolvedValue(mockAccount);

    await bitcoinWalletSnapClient.createAccount(MultichainNetworks.BITCOIN);
    expect(mockHandleSnapRequest).toHaveBeenCalledWith({
      origin: 'metamask',
      snapId: BITCOIN_WALLET_SNAP_ID,
      handler: HandlerType.OnKeyringRequest,
      request: expect.any(Object),
    });
  });

  it('force fetches the balance after creating a Bitcoin account', async () => {
    const { result } = renderHook(() => useBitcoinWalletSnapClient());
    const bitcoinWalletSnapClient = result.current;

    mockHandleSnapRequest.mockResolvedValue(mockAccount);

    await bitcoinWalletSnapClient.createAccount(MultichainNetworks.BITCOIN);
    expect(mockMultichainUpdateBalance).toHaveBeenCalledWith(mockAccount.id);
  });
});
