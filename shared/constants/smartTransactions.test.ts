import { isProduction } from '../modules/environment';
import { getAllowedSmartTransactionsChainIds } from './smartTransactions';
import { CHAIN_IDS } from './network';

jest.mock('../modules/environment', () => ({
  isProduction: jest.fn(() => false), // Initially mock isProduction to return false
}));

// Cast isProduction to jest.Mock to inform TypeScript about the mock type
const mockIsProduction = isProduction as jest.Mock;

describe('smartTransactions', () => {
  describe('getAllowedSmartTransactionsChainIds', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the correct chain IDs for development environment', () => {
      mockIsProduction.mockReturnValue(false);
      const allowedChainIds = getAllowedSmartTransactionsChainIds();
      expect(allowedChainIds).toStrictEqual([
        CHAIN_IDS.MAINNET,
        CHAIN_IDS.SEPOLIA,
        CHAIN_IDS.BSC,
        CHAIN_IDS.BASE,
        CHAIN_IDS.ARBITRUM,
        // CHAIN_IDS.LINEA_MAINNET, // TODO: Add linea mainnet to development when ready
        // CHAIN_IDS.LINEA_SEPOLIA, // TODO: Add linea sepolia to development when ready
      ]);
    });

    it('should return the correct chain IDs for production environment', () => {
      mockIsProduction.mockReturnValue(true);
      const allowedChainIds = getAllowedSmartTransactionsChainIds();
      expect(allowedChainIds).toStrictEqual([
        CHAIN_IDS.MAINNET,
        CHAIN_IDS.BSC,
        CHAIN_IDS.BASE,
        CHAIN_IDS.ARBITRUM,
        // CHAIN_IDS.LINEA_MAINNET, // TODO: Add linea mainnet to production when ready
        // CHAIN_IDS.LINEA_SEPOLIA, // TODO: Add linea sepolia to production when ready
      ]);
    });
  });
});
