import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockApproveConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { ApproveStaticSimulation } from './approve-static-simulation';

jest.mock('../hooks/use-approve-token-simulation', () => ({
  useApproveTokenSimulation: jest.fn(() => ({
    spendingCap: '1000',
    formattedSpendingCap: '1000',
    value: '1000',
  })),
}));

jest.mock('../../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 18,
  })),
}));

describe('<ApproveStaticSimulation />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = getMockApproveConfirmState();

    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveStaticSimulation />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
