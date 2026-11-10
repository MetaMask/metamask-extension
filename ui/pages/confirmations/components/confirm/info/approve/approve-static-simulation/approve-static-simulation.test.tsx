import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  getMockApproveConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedPermit2ApproveConfirmation,
  PERMIT2_TOKEN_ADDRESS,
} from '../../../../../../../../test/data/confirmations/token-approve';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { useIsNFT } from '../hooks/use-is-nft';
import { ApproveStaticSimulation } from './approve-static-simulation';

jest.mock('../hooks/use-approve-token-simulation', () => ({
  useApproveTokenSimulation: jest.fn(() => ({
    spendingCap: '1000',
    formattedSpendingCap: '1000',
    value: '1000',
    isUnlimitedSpendingCap: false,
    pending: false,
  })),
}));

jest.mock('../hooks/use-is-nft', () => ({
  useIsNFT: jest.fn(() => ({
    isNFT: false,
  })),
}));

jest.mock('../../../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 18,
  })),
}));

describe('<ApproveStaticSimulation />', () => {
  const middleware = [thunk];

  it('renders component when token is not an NFT', () => {
    (useIsNFT as jest.Mock).mockReturnValue({ isNFT: false });

    const state = getMockApproveConfirmState();

    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveStaticSimulation setIsOpenEditSpendingCapModal={jest.fn()} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders component when token is an NFT', () => {
    (useIsNFT as jest.Mock).mockReturnValue({ isNFT: true });

    const state = getMockApproveConfirmState();

    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <ApproveStaticSimulation setIsOpenEditSpendingCapModal={jest.fn()} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('calls setIsOpenEditSpendingCapModal when edit button is clicked', () => {
    (useIsNFT as jest.Mock).mockReturnValue({ isNFT: false });

    const state = getMockApproveConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const setIsOpenEditSpendingCapModal = jest.fn();

    const { getByTestId } = renderWithConfirmContextProvider(
      <ApproveStaticSimulation
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
      />,
      mockStore,
    );

    const editButton = getByTestId('edit-spending-cap-icon');
    fireEvent.click(editButton);

    expect(setIsOpenEditSpendingCapModal).toHaveBeenCalledWith(true);
  });

  it('shows the token from the calldata for Permit2 approvals', () => {
    (useIsNFT as jest.Mock).mockReturnValue({ isNFT: false });

    const transactionMeta = genUnapprovedPermit2ApproveConfirmation();
    const state = getMockConfirmStateForTransaction(transactionMeta);
    const mockStore = configureMockStore(middleware)(state);

    const { getByText, queryByText } = renderWithConfirmContextProvider(
      <ApproveStaticSimulation setIsOpenEditSpendingCapModal={jest.fn()} />,
      mockStore,
    );

    expect(useAssetDetails).toHaveBeenCalledWith(
      PERMIT2_TOKEN_ADDRESS,
      transactionMeta.txParams.from,
      transactionMeta.txParams.data,
      transactionMeta.chainId,
    );
    expect(getByText('0x11111...11111')).toBeInTheDocument();
    expect(queryByText('0x00000...78BA3')).not.toBeInTheDocument();
  });
});
