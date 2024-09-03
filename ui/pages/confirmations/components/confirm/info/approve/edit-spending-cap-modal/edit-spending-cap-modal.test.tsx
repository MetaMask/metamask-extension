import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { EditSpendingCapModal } from './edit-spending-cap-modal';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';
import { getMockApproveConfirmState } from '../../../../../../../../test/data/confirmations/helper';

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
    userBalance: '1000000',
    tokenSymbol: 'TST',
  })),
}));

describe('<EditSpendingCapModal />', () => {
  const middleware = [thunk];

  it('renders component', () => {
    const state = getMockApproveConfirmState();

    const mockStore = configureMockStore(middleware)(state);

    const isOpenEditSpendingCapModal = true;
    const setIsOpenEditSpendingCapModal = () =>
      console.log('setIsOpenEditSpendingCapModal');
    const customSpendingCap = '10';
    const setCustomSpendingCap = () => console.log('setCustomSpendingCap');

    const { container } = renderWithConfirmContextProvider(
      <EditSpendingCapModal
        isOpenEditSpendingCapModal={isOpenEditSpendingCapModal}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        customSpendingCap={customSpendingCap}
        setCustomSpendingCap={setCustomSpendingCap}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
