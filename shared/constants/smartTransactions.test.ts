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
      ]);
    });

    it('should return the correct chain IDs for production environment', () => {
      mockIsProduction.mockReturnValue(true);
      const allowedChainIds = getAllowedSmartTransactionsChainIds();
      expect(allowedChainIds).toStrictEqual([CHAIN_IDS.MAINNET, CHAIN_IDS.BSC]);
    });
  });
});
