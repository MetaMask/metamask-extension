import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { SpendingCap } from './spending-cap';

describe('<SpendingCap />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedApproveConfirmation(),
      },
    };
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
