import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { EditSpendingCapModal } from './edit-spending-cap-modal';

jest.mock('../../../../../hooks/useAssetDetails', () => ({
  ...jest.requireActual('../../../../../hooks/useAssetDetails'),
  useAssetDetails: jest.fn(),
}));

describe('<EditSpendingCapModal />', () => {
  const middleware = [thunk];

  let useAssetDetailsMock;
  beforeEach(() => {
    jest.resetAllMocks();

    useAssetDetailsMock = jest.fn().mockImplementation(() => ({
      userBalance: '1000000000000000000',
      tokenSymbol: 'TST',
      decimals: '18',
    }));
    (useAssetDetails as jest.Mock).mockImplementation(useAssetDetailsMock);
  });

  it('renders component', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedApproveConfirmation(),
      },
    };
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
