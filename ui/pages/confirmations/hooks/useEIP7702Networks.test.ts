import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useEIP7702Networks } from './useEIP7702Networks';

const mockNetworkConfig = {
  'eip155:1': {
    chainId: 'eip155:1',
    isEvm: true,
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    blockExplorerUrls: ['https://etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
  },
  'eip155:6342': {
    chainId: 'eip155:6342',
    isEvm: true,
    name: 'Mega Testnet',
    nativeCurrency: 'MegaETH',
    blockExplorerUrls: ['https://megaexplorer.xyz'],
    defaultBlockExplorerUrlIndex: 0,
  },
  'eip155:11155111': {
    chainId: 'eip155:11155111',
    isEvm: true,
    name: 'Sepolia',
    nativeCurrency: 'SepoliaETH',
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
  },
};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => [mockNetworkConfig],
}));

const mockNetworkBatchSupport = [
  {
    chainId: '0xaa36a7',
    isSupported: false,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  },
  {
    chainId: '0x18c6',
    isSupported: false,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  },
];

jest.mock('../../../store/controller-actions/transaction-controller', () => ({
  isAtomicBatchSupported: () => Promise.resolve(mockNetworkBatchSupport),
}));

function runHook() {
  const { result, rerender } = renderHookWithProvider(
    () => useEIP7702Networks('0x0'),
    {},
  );
  return { result: result.current, rerender };
}

describe('useEIP7702Networks', () => {
  it('returns pending as true initially', () => {
    const { result } = runHook();
    expect(result.pending).toBe(true);
    expect(result.network7702List).toHaveLength(0);
  });
});
