import React from 'react';
import { render } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import Tooltip from '../../../../components/ui/tooltip';
import { AmountPill } from './amount-pill';
import {
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
  amount: BigNumber,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const nativeAndErc20Cases = [
    {
      amount: new BigNumber(-123.1234567),
      expected: {
        text: '- 123.1',
        tooltip: '123.1234567',
      },
    },
    {
      amount: new BigNumber(789.412),
      expected: {
        text: '+ 789.4',
        tooltip: '789.412',
      },
    },
    {
      amount: new BigNumber(-0.000000001),
      expected: {
        text: '- <0.000001',
        tooltip: '0.000000001',
      },
    },
    {
      amount: new BigNumber(0.000000001),
      expected: {
        text: '+ <0.000001',
        tooltip: '0.000000001',
      },
    },
    {
      amount: new BigNumber(-0),
      expected: {
        text: '- 0',
        tooltip: '0',
      },
    },
    {
      amount: new BigNumber(0),
      expected: {
        text: '+ 0',
        tooltip: '0',
      },
    },
  ];

  describe('Native', () => {
    it.each(nativeAndErc20Cases)(
      'renders the correct sign and amount for $amount',
      ({ amount, expected }) => {
        renderAndExpect(NATIVE_ASSET_IDENTIFIER, amount, expected);
      },
    );
  });

  describe('ERC20', () => {
    it.each(nativeAndErc20Cases)(
      'renders the correct sign and amount for $amount',
      ({ amount, expected }) => {
        renderAndExpect(ERC20_ASSET_MOCK, amount, expected);
      },
    );
  });

  describe('ERC721', () => {
    const cases = [
      {
        amount: new BigNumber(-1),
        expected: {
          text: '- #2748',
          tooltip: '#2748',
        },
      },
      {
        amount: new BigNumber(1),
        expected: {
          text: '+ #2748',
          tooltip: '#2748',
        },
      },
    ];

    it.each(cases)(
      'renders the token ID with just a plus or minus for $expected.text',
      ({ amount, expected }) => {
        renderAndExpect(ERC721_ASSET_MOCK, amount, expected);
      },
    );
  });

  describe('ERC1155', () => {
    const cases = [
      {
        amount: new BigNumber(-3),
        expected: {
          text: '- 3 #2748',
          tooltip: '3 #2748',
        },
      },
      {
        amount: new BigNumber(8),
        expected: {
          text: '+ 8 #2748',
          tooltip: '8 #2748',
        },
      },
      {
        amount: new BigNumber(-12),
        expected: {
          text: '- 12 #2748',
          tooltip: '12 #2748',
        },
      },
    ];

    it.each(cases)(
      'renders the correct sign, amount, and token ID for $expected.text',
      ({ amount, expected }) => {
        renderAndExpect(ERC1155_ASSET_MOCK, amount, expected);
      },
    );
  });
});
