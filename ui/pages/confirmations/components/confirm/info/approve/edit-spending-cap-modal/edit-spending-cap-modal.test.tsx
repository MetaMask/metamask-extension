import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { genUnapprovedApproveConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { EditSpendingCapModal } from './edit-spending-cap-modal';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';

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
    const setIsOpenEditSpendingCapModal = () => {};
    const customSpendingCap = '10';
    const setCustomSpendingCap = () => {};

    const { container } = renderWithProvider(
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
