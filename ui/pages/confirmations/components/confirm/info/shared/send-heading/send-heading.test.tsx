import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  MOCK_CONFIRMATIONS_ACCOUNT_ID,
  getMockConfirmStateForTransaction,
} from '../../../../../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../../test/data/confirmations/token-transfer';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import SendHeading from './send-heading';

const KNOWN_TOKEN_ASSET_ID =
  'eip155:5/erc20:0x076146c765189d51be3160a2140cf80bfc73ad68';
const KNOWN_TOKEN_SYMBOL = 'TST';

jest.mock('../../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 18,
  })),
}));

describe('<SendHeading />', () => {
  const middleware = [thunk];
  const transaction = genUnapprovedTokenTransferConfirmation({
    chainId: '0x5',
  });
  const state = getMockConfirmStateForTransaction(transaction);
  const mockStore = configureMockStore(middleware)(state);

  it('renders component', () => {
    const { container } = renderWithConfirmContextProvider(
      <SendHeading />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders 8 decimals and the full amount in the tooltip for longer amounts', () => {
    // 1.123456789 tokens with 18 decimals
    const longAmountTransaction = genUnapprovedTokenTransferConfirmation({
      chainId: '0x5',
      amountHex:
        '0000000000000000000000000000000000000000000000000f9751ff4cd89200',
    });
    const longAmountStore = configureMockStore(middleware)(
      getMockConfirmStateForTransaction(longAmountTransaction),
    );

    const { container, getByTestId } = renderWithConfirmContextProvider(
      <SendHeading />,
      longAmountStore,
    );

    expect(getByTestId('confirm-send-amount')).toHaveTextContent('1.12345679');
    expect(container.querySelector('[data-original-title]')).toHaveAttribute(
      'data-original-title',
      '1.123456789',
    );
  });

  it('renders the known token symbol on the amount and avatar', () => {
    const knownTokenState = getMockConfirmStateForTransaction(transaction, {
      metamask: {
        assetsInfo: {
          [KNOWN_TOKEN_ASSET_ID]: {
            type: 'erc20',
            symbol: KNOWN_TOKEN_SYMBOL,
            decimals: 18,
            name: 'Test Token',
          },
        },
        assetsBalance: {
          [MOCK_CONFIRMATIONS_ACCOUNT_ID]: {
            [KNOWN_TOKEN_ASSET_ID]: { amount: '1' },
          },
        },
      },
    });
    const knownTokenStore = configureMockStore(middleware)(knownTokenState);

    const { container, getByTestId } = renderWithConfirmContextProvider(
      <SendHeading />,
      knownTokenStore,
    );

    expect(getByTestId('confirm-send-amount')).toHaveTextContent(
      KNOWN_TOKEN_SYMBOL,
    );
    expect(container.querySelector('.bg-default')).toBeInTheDocument();
    expect(container.querySelector('.text-default')).toBeInTheDocument();
    expect(
      container.querySelector('.bg-overlay-default'),
    ).not.toBeInTheDocument();
  });
});
