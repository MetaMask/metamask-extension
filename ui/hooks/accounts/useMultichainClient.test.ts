import { renderHook } from '@testing-library/react-hooks';
import { HandlerType } from '@metamask/snaps-utils';
import { BtcAccountType, BtcMethod } from '@metamask/keyring-api';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { BITCOIN_WALLET_SNAP_ID } from '../../../shared/lib/accounts/bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from '../../../shared/lib/accounts/solana-wallet-snap';
import {
  handleSnapRequest,
  multichainUpdateBalance,
} from '../../store/actions';
import { useMultichainClient, WalletClientType } from './useMultichainClient';

jest.mock('../../store/actions', () => ({
  handleSnapRequest: jest.fn(),
  multichainUpdateBalance: jest.fn(),
}));

const mockHandleSnapRequest = handleSnapRequest as jest.Mock;
const mockMultichainUpdateBalance = multichainUpdateBalance as jest.Mock;

describe('useMultichainClient', () => {
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
    const { result } = renderHook(() =>
      useMultichainClient(WalletClientType.Bitcoin),
    );
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
    const { result } = renderHook(() =>
      useMultichainClient(WalletClientType.Bitcoin),
    );
    const bitcoinWalletSnapClient = result.current;

    mockHandleSnapRequest.mockResolvedValue(mockAccount);

    await bitcoinWalletSnapClient.createAccount(MultichainNetworks.BITCOIN);
    expect(mockMultichainUpdateBalance).toHaveBeenCalledWith(mockAccount.id);
  });

  it('dispatches a Snap keyring request to create a Solana account', async () => {
    const { result } = renderHook(() =>
      useMultichainClient(WalletClientType.Solana),
    );
    const multichainClient = result.current;

    mockHandleSnapRequest.mockResolvedValue(mockAccount);

    await multichainClient.createAccount(MultichainNetworks.SOLANA);
    expect(mockHandleSnapRequest).toHaveBeenCalledWith({
      origin: 'metamask',
      snapId: SOLANA_WALLET_SNAP_ID,
      handler: HandlerType.OnKeyringRequest,
      request: expect.any(Object),
    });
  });

  it('force fetches the balance after creating a Solana account', async () => {
    const { result } = renderHook(() =>
      useMultichainClient(WalletClientType.Solana),
    );
    const multichainClient = result.current;

    mockHandleSnapRequest.mockResolvedValue(mockAccount);

    await multichainClient.createAccount(MultichainNetworks.SOLANA);
    expect(mockMultichainUpdateBalance).toHaveBeenCalledWith(mockAccount.id);
  });
});
