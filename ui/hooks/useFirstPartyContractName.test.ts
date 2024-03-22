import { NameType } from '@metamask/name-controller';
import { getCurrentChainId } from '../selectors';
import { CHAIN_IDS } from '../../shared/constants/network';
import { useFirstPartyContractName } from './useFirstPartyContractName';

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(),
}));

jest.mock('../selectors', () => ({
  getCurrentChainId: jest.fn(),
  getNames: jest.fn(),
}));

const BRIDGE_NAME_MOCK = 'MetaMask Bridge';
const BRIDGE_MAINNET_ADDRESS_MOCK =
  '0x0439e60F02a8900a951603950d8D4527f400C3f1';
const BRIDGE_OPTIMISM_ADDRESS_MOCK =
  '0xB90357f2b86dbfD59c3502215d4060f71DF8ca0e';
const UNKNOWN_ADDRESS_MOCK = '0xabc123';

describe('useFirstPartyContractName', () => {
  const getCurrentChainIdMock = jest.mocked(getCurrentChainId);
  beforeEach(() => {
    jest.resetAllMocks();

    getCurrentChainIdMock.mockReturnValue(CHAIN_IDS.MAINNET);
  });

  it('returns null if no name found', () => {
    const name = useFirstPartyContractName(
      UNKNOWN_ADDRESS_MOCK,
      NameType.ETHEREUM_ADDRESS,
    );

    expect(name).toBe(null);
  });

  it('returns name if found', () => {
    const name = useFirstPartyContractName(
      BRIDGE_MAINNET_ADDRESS_MOCK,
      NameType.ETHEREUM_ADDRESS,
    );
    expect(name).toBe(BRIDGE_NAME_MOCK);
  });

  it('uses variation if specified', () => {
    const name = useFirstPartyContractName(
      BRIDGE_OPTIMISM_ADDRESS_MOCK,
      NameType.ETHEREUM_ADDRESS,
      CHAIN_IDS.OPTIMISM,
    );

    expect(name).toBe(BRIDGE_NAME_MOCK);
  });

  it('returns null if type is not address', () => {
    const alternateType = 'alternateType' as NameType;

    const name = useFirstPartyContractName(
      BRIDGE_MAINNET_ADDRESS_MOCK,
      alternateType,
    );

    expect(name).toBe(null);
  });

  it('normalizes addresses to lowercase', () => {
    const name = useFirstPartyContractName(
      BRIDGE_MAINNET_ADDRESS_MOCK.toUpperCase(),
      NameType.ETHEREUM_ADDRESS,
    );

    expect(name).toBe(BRIDGE_NAME_MOCK);
  });
});
