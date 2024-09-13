import React from 'react';
import configureMockStore from 'redux-mock-store';
import { BigNumber } from 'bignumber.js';
import { fireEvent } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import thunk from 'redux-thunk';
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
import messages from '../../../../../app/_locales/en/messages.json';
import { MultichainConfirmTransactionPage } from './multichain-confirm-transaction';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

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
  const middlewares = [thunk];
  const store = configureMockStore(middlewares)(mockState);
  return {
    result: renderWithProvider(<MultichainConfirmTransactionPage />, store),
    store,
  };
};

describe('MultichainConfirmTransactionPage', () => {
  it('renders', () => {
    const {
      result: { getByTestId },
    } = render(baseStore);

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
    expect(getByTestId('recipient-address')).toHaveTextContent(
      expectedRecipient,
    );
  });

  it('redirects to send page if there is no draft transaction', () => {
    const storeWithoutDraft = cloneDeep(baseStore);
    storeWithoutDraft.multichainSend.currentTransactionUUID = '';
    render(storeWithoutDraft);

    expect(mockHistoryPush).toHaveBeenCalledWith('/multichain-send');
  });

  it('redirects to the send page when the back button is clicked', () => {
    const {
      result: { getByTestId },
    } = render(baseStore);

    const backButton = getByTestId(
      'multichain-confirm-transaction-back-button',
    );
    fireEvent.click(backButton);

    expect(mockHistoryPush).toHaveBeenCalledWith('/multichain-send');
  });

  it('redirects to home when cancel is clicked', () => {
    const {
      result: { getByText },
    } = render(baseStore);

    const cancelButton = getByText(messages.cancel.message);
    fireEvent.click(cancelButton);

    expect(mockHistoryPush).toHaveBeenCalledWith('/home');
  });

  it('triggers the signAndSend action when the confirm button is clicked', async () => {
    const {
      result: { getByText },
      store,
    } = render(baseStore);

    const confirmButton = getByText(messages.confirm.message);
    fireEvent.click(confirmButton);

    const dispatchedActions = store.getActions();

    expect(dispatchedActions).toHaveLength(1);
    expect(dispatchedActions[0]).toStrictEqual({
      type: 'multichainSend/signAndSend/pending',
      meta: {
        requestId: expect.any(String),
        requestStatus: 'pending',
        arg: {
          account: getSelectedInternalAccount(baseStore),
          transactionId: baseStore.multichainSend.currentTransactionUUID,
        },
      },
      payload: undefined,
    });
  });
});
