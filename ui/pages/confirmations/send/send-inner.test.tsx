import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import * as SendContext from '../context/send';
import { SendPages } from '../constants/send';
import { SendInner } from './send-inner';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '' }),
  useSearchParams: () => [{ get: () => null }],
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

    const { getByText } = render();
    expect(getByText('asset')).toBeInTheDocument();
  });

  it('render amount page when current page in path is amount', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.AMOUNT,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const { getByText } = render();
    expect(getByText('AMOUNT')).toBeInTheDocument();
  });

  it('render recipient page when current page in path is recipient', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      currentPage: SendPages.RECIPIENT,
      updateCurrentPage: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const { getByText } = render();
    expect(getByText('TO')).toBeInTheDocument();
  });
});
