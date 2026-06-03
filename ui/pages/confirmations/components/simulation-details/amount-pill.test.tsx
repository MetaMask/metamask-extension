import React from 'react';
import { render } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import Tooltip from '../../../../components/ui/tooltip';
import { TOKEN_VALUE_UNLIMITED_THRESHOLD } from '../confirm/info/shared/constants';
import { AmountPill } from './amount-pill';
import {
  AssetIdentifier,
  NativeAssetIdentifier,
  TokenAssetIdentifier,
} from './types';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(() => 'en-US'),
}));

jest.mock('../../../../components/ui/tooltip', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

const TOKEN_ID_MOCK = '0xabc';
const CHAIN_ID_MOCK = '0x1';

const NATIVE_ASSET_MOCK: NativeAssetIdentifier = {
  chainId: CHAIN_ID_MOCK,
  standard: TokenStandard.none,
};

const ERC20_ASSET_MOCK: TokenAssetIdentifier = {
  chainId: CHAIN_ID_MOCK,
  standard: TokenStandard.ERC20,
  address: '0x456',
};

const ERC721_ASSET_MOCK: TokenAssetIdentifier = {
  chainId: CHAIN_ID_MOCK,
  standard: TokenStandard.ERC721,
  address: '0x123',
  tokenId: TOKEN_ID_MOCK,
};

const ERC1155_ASSET_MOCK: TokenAssetIdentifier = {
  chainId: CHAIN_ID_MOCK,
  standard: TokenStandard.ERC1155,
  address: '0x789',
  tokenId: TOKEN_ID_MOCK,
};

const renderAndExpect = (
  asset: AssetIdentifier,
  amount: BigNumber,
  expected: { text: string; tooltip: string },
  {
    isApproval,
    isAllApproval,
    isUnlimitedApproval,
  }: {
    isApproval?: boolean;
    isAllApproval?: boolean;
    isUnlimitedApproval?: boolean;
  } = {},
): void => {
  const { getByText } = render(
    <AmountPill
      asset={asset}
      amount={amount}
      isApproval={isApproval}
      isAllApproval={isAllApproval}
      isUnlimitedApproval={isUnlimitedApproval}
    />,
  );

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
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(nativeAndErc20Cases)(
      'renders the correct sign and amount for $amount',
      ({
        amount,
        expected,
      }: {
        amount: BigNumber;
        expected: { text: string; tooltip: string };
      }) => {
        renderAndExpect(NATIVE_ASSET_MOCK, amount, expected);
      },
    );
  });

  describe('ERC20', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(nativeAndErc20Cases)(
      'renders the correct sign and amount for $amount',
      ({
        amount,
        expected,
      }: {
        amount: BigNumber;
        expected: { text: string; tooltip: string };
      }) => {
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

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(cases)(
      'renders the token ID with just a plus or minus for $expected.text',
      ({
        amount,
        expected,
      }: {
        amount: BigNumber;
        expected: { text: string; tooltip: string };
      }) => {
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

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(cases)(
      'renders the correct sign, amount, and token ID for $expected.text',
      ({
        amount,
        expected,
      }: {
        amount: BigNumber;
        expected: { text: string; tooltip: string };
      }) => {
        renderAndExpect(ERC1155_ASSET_MOCK, amount, expected);
      },
    );
  });

  it('renders shortened token id if given id is too long', () => {
    const longHexadecimalTokenId = '0x11111111111111111111111111111';
    const longTokenIdInDecimal = '5538449982437149470432529417834769';
    renderAndExpect(
      {
        ...ERC721_ASSET_MOCK,
        tokenId: longHexadecimalTokenId,
      },
      new BigNumber(1),
      {
        text: '+ #5538...4769',
        tooltip: `#${longTokenIdInDecimal}`,
      },
    );
  });

  describe('Approval', () => {
    it('renders ERC-20 approval', () => {
      renderAndExpect(
        ERC20_ASSET_MOCK,
        new BigNumber(123.45),
        {
          text: '123.5',
          tooltip: '123.45',
        },
        { isApproval: true },
      );
    });

    it('renders ERC-721 approval', () => {
      renderAndExpect(
        ERC721_ASSET_MOCK,
        new BigNumber(1),
        {
          text: '#2748',
          tooltip: '#2748',
        },
        { isApproval: true },
      );
    });

    it('renders unlimited ERC-20 approval', () => {
      renderAndExpect(
        ERC20_ASSET_MOCK,
        new BigNumber(TOKEN_VALUE_UNLIMITED_THRESHOLD),
        {
          text: '[unlimited]',
          tooltip: '1,000,000,000,000,000',
        },
        { isApproval: true, isUnlimitedApproval: true },
      );
    });

    it('renders all ERC-721 approval', () => {
      renderAndExpect(
        { ...ERC721_ASSET_MOCK, tokenId: undefined },
        new BigNumber(1),
        {
          text: '[all]',
          tooltip: '[all]',
        },
        { isApproval: true, isAllApproval: true },
      );
    });

    it('renders all ERC-1155 approval', () => {
      renderAndExpect(
        { ...ERC1155_ASSET_MOCK, tokenId: undefined },
        new BigNumber(1),
        {
          text: '[all]',
          tooltip: '[all]',
        },
        { isApproval: true, isAllApproval: true },
      );
    });
  });
});
