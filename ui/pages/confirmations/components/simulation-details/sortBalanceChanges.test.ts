import { TokenStandard } from '../../../../../shared/constants/transaction';
import { sortBalanceChanges } from './sortBalanceChanges';
import { BalanceChange, FIAT_UNAVAILABLE } from './types';

describe('sortBalanceChanges', () => {
  // Create a mock balance change object.
  const bc = (
    fiatAmount: number | typeof FIAT_UNAVAILABLE,
    standard: TokenStandard,
  ): BalanceChange =>
    ({
      fiatAmount,
      asset: { standard },
    } as BalanceChange);

  it.each([
    {
      criteria: 'fiat amount',
      balanceChanges: [
        bc(200, TokenStandard.ERC20),
        bc(FIAT_UNAVAILABLE, TokenStandard.ERC20),
        bc(100, TokenStandard.ERC20),
        bc(300, TokenStandard.ERC20),
      ],
      expectedOrder: [
        bc(300, TokenStandard.ERC20),
        bc(200, TokenStandard.ERC20),
        bc(100, TokenStandard.ERC20),
        bc(FIAT_UNAVAILABLE, TokenStandard.ERC20),
      ],
    },
    {
      criteria: 'token standard',
      balanceChanges: [
        bc(100, TokenStandard.ERC721),
        bc(100, TokenStandard.ERC20),
        bc(100, TokenStandard.ERC1155),
        bc(100, TokenStandard.none),
      ],
      expectedOrder: [
        bc(100, TokenStandard.none),
        bc(100, TokenStandard.ERC20),
        bc(100, TokenStandard.ERC721),
        bc(100, TokenStandard.ERC1155),
      ],
    },
    {
      criteria: 'fiat amount then token standard',
      balanceChanges: [
        bc(FIAT_UNAVAILABLE, TokenStandard.ERC1155),
        bc(200, TokenStandard.ERC20),
        bc(200, TokenStandard.none),
        bc(FIAT_UNAVAILABLE, TokenStandard.ERC721),
        bc(100, TokenStandard.ERC20),
        bc(100, TokenStandard.none),
      ],
      expectedOrder: [
        bc(200, TokenStandard.none),
        bc(200, TokenStandard.ERC20),
        bc(100, TokenStandard.none),
        bc(100, TokenStandard.ERC20),
        bc(FIAT_UNAVAILABLE, TokenStandard.ERC721),
        bc(FIAT_UNAVAILABLE, TokenStandard.ERC1155),
      ],
    },
  ])(
    'should sort balance changes based on $criteria',
    ({ balanceChanges, expectedOrder }) => {
      const sorted = sortBalanceChanges(balanceChanges);
      expect(sorted).toEqual(expectedOrder);
    },
  );
});
