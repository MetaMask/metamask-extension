import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import userEvent from '@testing-library/user-event';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import * as Actions from '../../../../store/actions';
import * as GasFeeContext from '../../../../contexts/gasFee';
import CustomSpendingCap from './custom-spending-cap';

const props = {
  txParams: {
    data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
    from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    gas: '0xb41b',
    maxFeePerGas: '0x4a817c800',
    maxPriorityFeePerGas: '0x4a817c800',
    to: '0x665933d73375e385bef40abcccea8b4cccc32d4c',
    value: '0x0',
  },
  tokenName: 'TST',
  currentTokenBalance: '10',
  dappProposedValue: '7',
  siteOrigin: 'https://metamask.github.io',
  decimals: '4',
  passTheErrorText: () => undefined,
  setInputChangeInProgress: () => undefined,
  customSpendingCap: '7',
  setCustomSpendingCap: () => undefined,
};

describe('CustomSpendingCap', () => {
  const store = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <CustomSpendingCap {...props} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should change in token allowance amount should call functions to update gas limit', async () => {
    const user = userEvent.setup();
    const spyEstimateGas = jest
      .spyOn(Actions, 'estimateGas')
      .mockReturnValue(Promise.resolve('1770'));
    const updateTransactionMock = jest.fn();
    jest
      .spyOn(GasFeeContext, 'useGasFeeContext')
      .mockImplementation(() => ({ updateTransaction: updateTransactionMock }));

    const { getByRole } = renderWithProvider(
      <CustomSpendingCap {...props} />,
      store,
    );
    await user.type(getByRole('textbox'), '5');

    expect(spyEstimateGas).toHaveBeenCalledTimes(1);
    expect(updateTransactionMock).toHaveBeenCalledTimes(1);
  });
});
