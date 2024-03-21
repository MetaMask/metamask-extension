import React from 'react';
import { render } from '@testing-library/react';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { Numeric } from '../../../../shared/modules/Numeric';
import { AmountPill } from './amount-pill';
import { Amount, TokenAssetIdentifier } from './types';

const TOKEN_ID_MOCK = '0xabc';

const ERC20_ASSET_MOCK: TokenAssetIdentifier = {
  standard: TokenStandard.ERC20,
  address: '0x456',
};
const ERC721_ASSET_MOCK: TokenAssetIdentifier = {
  standard: TokenStandard.ERC721,
  address: '0x123',
  tokenId: TOKEN_ID_MOCK,
};
const ERC1155_ASSET_MOCK: TokenAssetIdentifier = {
  standard: TokenStandard.ERC1155,
  address: '0x789',
  tokenId: TOKEN_ID_MOCK,
};

describe('AmountPill', () => {
  describe('ERC20', () => {
    const cases = [
      {
        isNegative: true,
        numeric: new Numeric(-123.456, 10),
        expected: '- 123.456',
      },
      {
        isNegative: false,
        numeric: new Numeric(789.012, 10),
        expected: '+ 789.012',
      },
    ];
    it.each(cases)(
      'renders the correct sign and amount',
      ({ isNegative, numeric, expected }) => {
        const amount = { isNegative, numeric } as Amount;

        const { getByText } = render(
          <AmountPill asset={ERC20_ASSET_MOCK} amount={amount} />,
        );
        expect(getByText(expected)).toBeInTheDocument();
      },
    );
  });

  describe('ERC721', () => {
    const cases = [
      {
        isNegative: true,
        numeric: new Numeric(-1, 10),
        expected: '- #2748',
      },
      {
        isNegative: false,
        numeric: new Numeric(1, 10),
        expected: '+ #2748',
      },
    ];

    it.each(cases)(
      'renders the token ID with just a plus or minus',
      ({ isNegative, numeric, expected }) => {
        const amount = {
          isNegative,
          numeric,
        } as Amount;

        const { getByText } = render(
          <AmountPill asset={ERC721_ASSET_MOCK} amount={amount} />,
        );
        expect(getByText(expected)).toBeInTheDocument();
      },
    );

    it('does not render the amount', () => {
      const amount = {
        isNegative: true,
        numeric: new Numeric(1, 10),
      } as Amount;

      const { queryByText } = render(
        <AmountPill asset={ERC721_ASSET_MOCK} amount={amount} />,
      );
      expect(queryByText('-')).not.toBeInTheDocument();
    });
  });

  describe('ERC1155', () => {
    const cases = [
      {
        isNegative: true,
        numeric: new Numeric(-3, 10),
        expected: '- 3 #2748',
      },
      {
        isNegative: false,
        numeric: new Numeric(8, 10),
        expected: '+ 8 #2748',
      },
      {
        isNegative: true,
        numeric: new Numeric(-12, 10),
        expected: '- 12 #2748',
      },
    ];

    it.each(cases)(
      'renders the correct sign, amount, and token ID',
      ({ isNegative, numeric, expected }) => {
        const amount = { isNegative, numeric } as Amount;

        const { getByText } = render(
          <AmountPill asset={ERC1155_ASSET_MOCK} amount={amount} />,
        );
        expect(getByText(expected)).toBeInTheDocument();
      },
    );
  });
});
