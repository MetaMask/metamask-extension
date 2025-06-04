import { SnapKeyringInternalOptions } from '@metamask/eth-snap-keyring';
import {
  BtcAccountType,
  BtcMethod,
  BtcScope,
  SolAccountType,
  SolMethod,
  SolScope,
} from '@metamask/keyring-api';
import { renderHook } from '@testing-library/react-hooks';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  BITCOIN_WALLET_SNAP_ID,
  SOLANA_WALLET_SNAP_ID,
  type CreateAccountSnapOptions,
} from '../../../shared/lib/accounts';
import { createSnapAccount } from '../../store/actions';
import {
  useMultichainWalletSnapClient,
  WalletClientType,
} from './useMultichainWalletSnapClient';

jest.mock('../../store/actions', () => ({
  createSnapAccount: jest.fn(),
}));

const mockCreateSnapAccount = createSnapAccount as jest.Mock;

describe('useMultichainWalletSnapClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testCases = [
    {
      clientType: WalletClientType.Bitcoin,
      network: MultichainNetworks.BITCOIN,
      snapId: BITCOIN_WALLET_SNAP_ID,
      mockAccount: {
        address: 'tb1q2hjrlnf8kmtt5dj6e49gqzy6jnpe0sj7ty50cl',
        id: '11a33c6b-0d46-43f4-a401-01587d575fd0',
        options: {},
        methods: [BtcMethod.SendBitcoin],
        scopes: [BtcScope.Testnet],
        type: BtcAccountType.P2wpkh,
      },
    },
    {
      clientType: WalletClientType.Solana,
      network: MultichainNetworks.SOLANA,
      snapId: SOLANA_WALLET_SNAP_ID,
      mockAccount: {
        address: '4mip4tgbhxf8dpqvtb3zhzzapwfvznanhssqzgjyp7ha',
        id: '22b44d7c-1e57-4b5b-8502-02698e686fd1',
        options: {},
        methods: [SolMethod.SendAndConfirmTransaction],
        scopes: [SolScope.Mainnet, SolScope.Testnet, SolScope.Devnet],
        type: SolAccountType.DataAccount,
      },
    },
  ];

  testCases.forEach(({ clientType, network, snapId, mockAccount }) => {
    const options: CreateAccountSnapOptions = {
      scope: network,
      entropySource: 'test-entropy-source',
    };
    if (clientType === WalletClientType.Bitcoin) {
      options.synchronize = true;
    }

    it(`creates a ${clientType} account`, async () => {
      const { result } = renderHook(() =>
        useMultichainWalletSnapClient(clientType),
      );
      const multichainWalletSnapClient = result.current;

      mockCreateSnapAccount.mockResolvedValue(mockAccount);

      await multichainWalletSnapClient.createAccount(options);
      expect(mockCreateSnapAccount).toHaveBeenCalledWith(
        snapId,
        options,
        undefined, // No internal options.
      );
    });

    it(`creates a ${clientType} account with custom internal options`, async () => {
      const { result } = renderHook(() =>
        useMultichainWalletSnapClient(clientType),
      );
      const multichainWalletSnapClient = result.current;

      mockCreateSnapAccount.mockResolvedValue(mockAccount);

      const internalOptions: SnapKeyringInternalOptions = {
        displayConfirmation: false,
        displayAccountNameSuggestion: false,
        setSelectedAccount: false,
      };
      await multichainWalletSnapClient.createAccount(options, internalOptions);
      expect(mockCreateSnapAccount).toHaveBeenCalledWith(
        snapId,
        options,
        internalOptions,
      );
    });
  });
});
