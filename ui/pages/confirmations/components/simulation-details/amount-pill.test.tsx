import React from 'react';
import { render } from '@testing-library/react';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { Numeric } from '../../../../../shared/modules/Numeric';
import Tooltip from '../../../../components/ui/tooltip';
import { AmountPill } from './amount-pill';
import {
  Amount,
  AssetIdentifier,
  NATIVE_ASSET_IDENTIFIER,
  TokenAssetIdentifier,
} from './types';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(() => 'en-US'),
}));

jest.mock('../../../../components/ui/tooltip', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

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

const renderAndExpect = (
  asset: AssetIdentifier,
  amount: Amount,
  expected: { text: string; tooltip: string },
): void => {
  const { getByText } = render(<AmountPill asset={asset} amount={amount} />);
  expect(getByText(expected.text)).toBeInTheDocument();
  expect(Tooltip).toHaveBeenCalledWith(
    expect.objectContaining({ title: expected.tooltip }),
    {},
  );
};

describe('AmountPill', () => {
  const nativeAndErc20Cases = [
    {
      isNegative: true,
      numeric: new Numeric(-123.1234567, 10),
      expected: {
        text: '- 123.123457',
        tooltip: '123.1234567',
      },
    },
    {
      isNegative: false,
      numeric: new Numeric(789.012, 10),
      expected: {
        text: '+ 789.012',
        tooltip: '789.012',
      },
    },
    {
      isNegative: true,
      numeric: new Numeric(-0.000000001, 10),
      expected: {
        text: '- <0.000001',
        tooltip: '0.000000001',
      },
    },
    {
      isNegative: false,
      numeric: new Numeric(0.000000001, 10),
      expected: {
        text: '+ <0.000001',
        tooltip: '0.000000001',
      },
    },
    {
      isNegative: true,
      numeric: new Numeric(0, 10),
      expected: {
        text: '- 0',
        tooltip: '0',
      },
    },
    {
      isNegative: false,
      numeric: new Numeric(0, 10),
      expected: {
        text: '+ 0',
        tooltip: '0',
      },
    },
  ];

  describe('Native', () => {
    it.each(nativeAndErc20Cases)(
      'renders the correct sign and amount for $numeric.value',
      ({ isNegative, numeric, expected }) => {
        renderAndExpect(
          NATIVE_ASSET_IDENTIFIER,
          { isNegative, numeric } as Amount,
          expected,
        );
      },
    );
  });

  describe('ERC20', () => {
    it.each(nativeAndErc20Cases)(
      'renders the correct sign and amount for $numeric.value',
      ({ isNegative, numeric, expected }) => {
        renderAndExpect(
          ERC20_ASSET_MOCK,
          { isNegative, numeric } as Amount,
          expected,
        );
      },
    );
  });

  describe('ERC721', () => {
    const cases = [
      {
        isNegative: true,
        numeric: new Numeric(-1, 10),
        expected: {
          text: '- #2748',
          tooltip: '#2748',
        },
      },
      {
        isNegative: false,
        numeric: new Numeric(1, 10),
        expected: {
          text: '+ #2748',
          tooltip: '#2748',
        },
      },
    ];

    it.each(cases)(
      'renders the token ID with just a plus or minus for $expected.text',
      ({ isNegative, numeric, expected }) => {
        renderAndExpect(
          ERC721_ASSET_MOCK,
          { isNegative, numeric } as Amount,
          expected,
        );
      },
    );
  });

  describe('ERC1155', () => {
    const cases = [
      {
        isNegative: true,
        numeric: new Numeric(-3, 10),
        expected: {
          text: '- 3 #2748',
          tooltip: '3 #2748',
        },
      },
      {
        isNegative: false,
        numeric: new Numeric(8, 10),
        expected: {
          text: '+ 8 #2748',
          tooltip: '8 #2748',
        },
      },
      {
        isNegative: true,
        numeric: new Numeric(-12, 10),
        expected: {
          text: '- 12 #2748',
          tooltip: '12 #2748',
        },
      },
    ];

    it.each(cases)(
      'renders the correct sign, amount, and token ID for $expected.text',
      ({ isNegative, numeric, expected }) => {
        renderAndExpect(
          ERC1155_ASSET_MOCK,
          { isNegative, numeric } as Amount,
          expected,
        );
      },
    );
  });
});
