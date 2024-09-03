import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockApproveConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { SpendingCap } from './spending-cap';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';

jest.mock('../hooks/use-approve-token-simulation', () => ({
  useApproveTokenSimulation: jest.fn(() => ({
    spendingCap: '1000',
    formattedSpendingCap: '1000',
    value: '1000',
  })),
}));

describe('<SpendingCap />', () => {
  const middleware = [thunk];
  useApproveTokenSimulation;

  it('renders component', () => {
    const state = getMockApproveConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const setIsOpenEditSpendingCapModal = () => {};
    const customSpendingCap = '10';

    const { container } = renderWithConfirmContextProvider(
      <SpendingCap
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        customSpendingCap={customSpendingCap}
      />,

      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
