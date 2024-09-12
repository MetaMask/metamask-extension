import { isProduction } from '../modules/environment';
import { CHAIN_IDS } from './network';
import { getAllowedSmartTransactionsChainIds } from './smartTransactions';

jest.mock('../../../shared/modules/environment', () => ({
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
      ]);
    });

    it('should return the correct chain IDs for production environment', () => {
      mockIsProduction.mockReturnValue(true);
      const allowedChainIds = getAllowedSmartTransactionsChainIds();
      expect(allowedChainIds).toStrictEqual([CHAIN_IDS.MAINNET]);
    });
  });
});
