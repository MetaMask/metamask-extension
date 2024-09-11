import React from 'react';
import configureMockStore from 'redux-mock-store';
import { BigNumber } from 'bignumber.js';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockMultichainSendState from '../../../../../test/data/mock-multichain-send-state.json';
import {
  getCurrentMultichainDraftTransaction,
  getMultichainConversionRate,
  getMultichainDraftTransactionFee,
  MultichainState,
  MultichainReduxSendState,
  getMultichainCurrentCurrency,
  getMultichainNetwork,
} from '../../../../selectors/multichain';
import { convertUnitToHighestDenomination } from '../../../../helpers/utils/multichain/convertUnitToHighestDenomination';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import { getSelectedInternalAccount } from '../../../../selectors';
import { shortenAddress } from '../../../../helpers/utils/util';
import { MultichainConfirmTransactionPage } from './multichain-confirm-transaction';

const baseStore = {
  ...mockMultichainSendState,
  metamask: {
    ...mockMultichainSendState.metamask,
    rates: {
      btc: {
        conversionDate: 1620710825.03,
        conversionRate: 56594.07,
        usdConversionRate: 56594.07,
      },
    },
  },
};

const getExpectedValues = (state: unknown) => {
  const currencyConversion = getMultichainConversionRate(
    state as unknown as MultichainState,
  );
  const currencyCode = getMultichainCurrentCurrency(
    state as unknown as MultichainState,
  );
  const fees = getMultichainDraftTransactionFee(
    state as MultichainReduxSendState,
  );
  const transaction = getCurrentMultichainDraftTransaction(
    state as MultichainReduxSendState,
  );
  const { fee: expectedFee } = fees;
  const { amount: expectedSendAmount } =
    // eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    transaction?.transactionParams.sendAsset!;

  const expectedTotal = convertUnitToHighestDenomination({
    // eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    asset: transaction?.transactionParams.sendAsset?.assetDetails!,
    amount: new BigNumber(expectedFee)
      .add(new BigNumber(expectedSendAmount))
      .toString(),
  });
  const expectedTotalDisplay = `${expectedTotal} ${transaction?.transactionParams.sendAsset?.assetDetails.symbol}`;
  const expectedFeeDisplay = convertUnitToHighestDenomination({
    // eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    asset: transaction?.transactionParams.sendAsset?.assetDetails!,
    amount: expectedFee,
  });
  const expectedFiatTotalDisplay = formatCurrency(
    new BigNumber(expectedTotal).mul(currencyConversion).toString(),
    currencyCode,
  );

  const expectedSender = getSelectedInternalAccount(state).metadata.name;
  const expectedRecipient = shortenAddress(
    transaction?.transactionParams.recipient.address,
  );
  const expectedNetwork = getMultichainNetwork(
    state as MultichainState,
  ).nickname;

  return {
    expectedSender,
    expectedRecipient,
    expectedNetwork,
    expectedTotalDisplay,
    expectedFiatTotalDisplay,
    expectedFeeDisplay,
  };
};

// TODO: Fix type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const render = (state: any) => {
  const mockState = {
    ...state,
  };
  const store = configureMockStore()(mockState);
  return renderWithProvider(<MultichainConfirmTransactionPage />, store);
};

describe('MultichainConfirmTransactionPage', () => {
  it('renders', () => {
    const { getByTestId } = render(baseStore);

    const {
      expectedSender,
      expectedRecipient,
      expectedNetwork,
      expectedTotalDisplay,
      expectedFiatTotalDisplay,
      expectedFeeDisplay,
    } = getExpectedValues(baseStore);

    expect(
      getByTestId('multichain-confirmation-total-balance'),
    ).toHaveTextContent(expectedTotalDisplay);
    expect(
      getByTestId('multichain-confirmation-total-fiat-balance'),
    ).toHaveTextContent(expectedFiatTotalDisplay);
    expect(getByTestId('multichain-confirmation-fee')).toHaveTextContent(
      expectedFeeDisplay,
    );
    expect(
      getByTestId('multichain-confirmation-destination-network'),
    ).toHaveTextContent(expectedNetwork);
    expect(getByTestId('sender-address')).toHaveTextContent(expectedSender);
    expect(getByTestId('sender-to-recipient__name')).toHaveTextContent(
      expectedRecipient,
    );
  });
});
