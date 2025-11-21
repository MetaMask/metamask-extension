import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as SendContext from '../context/send';
import { SendPages } from '../constants/send';
import { SendInner } from './send-inner';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '' }),
  useSearchParams: () => [{ get: () => null }],
}));

jest.mock('../hooks/send/useSendAssets', () => {
  return {
    useSendAssets: jest.fn().mockReturnValue({ tokens: [], nfts: [] }),
  };
});

jest.mock('../components/send/asset', () => ({
  Asset: () => <div data-testid="asset-page">Asset page</div>,
}));

jest.mock('../components/send/amount-recipient', () => ({
  AmountRecipient: () => (
    <div data-testid="amount-recipient-page">Amount recipient page</div>
  ),
}));

const mockStore = configureMockStore([])(mockState);

const render = () => {
  return renderWithProvider(<SendInner />, mockStore);
};

describe('SendInner', () => {
  it('render asset page when current page in path is asset', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.ASSET,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const { getByTestId, queryByTestId } = render();
    expect(getByTestId('asset-page')).toBeInTheDocument();
    expect(queryByTestId('amount-recipient-page')).not.toBeInTheDocument();
  });

  it('render AmountRecipient page when current page in path is amount-recipient', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.AMOUNTRECIPIENT,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const { getByText, queryByTestId } = render();
    expect(getByText('Amount recipient page')).toBeInTheDocument();
    expect(queryByTestId('asset-page')).not.toBeInTheDocument();
  });
});
