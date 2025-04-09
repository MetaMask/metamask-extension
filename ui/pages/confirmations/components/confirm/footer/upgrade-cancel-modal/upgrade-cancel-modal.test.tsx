import React from 'react';
import { act } from '@testing-library/react';
import { rpcErrors } from '@metamask/rpc-errors';
import configureStore from '../../../../../../store/store';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import {
  CHAIN_ID,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import {
  disableAccountUpgradeForChainAndAddress,
  rejectPendingApproval,
} from '../../../../../../store/actions';
import { UpgradeCancelModal } from './upgrade-cancel-modal';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  rejectPendingApproval: jest.fn(),
  disableAccountUpgradeForChainAndAddress: jest.fn(),
}));

const STORE_MOCK = configureStore(
  getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation(),
  ),
);

describe('UpgradeCancelModal', () => {
  const rejectPendingApprovalMock = jest.mocked(rejectPendingApproval);

  const disableAccountUpgradeForChainAndAddressMock = jest.mocked(
    disableAccountUpgradeForChainAndAddress,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    rejectPendingApprovalMock.mockReturnValue({ type: 'mockAction' } as never);
    disableAccountUpgradeForChainAndAddressMock.mockResolvedValue({});
  });

  it('renders cancel buttons', () => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <UpgradeCancelModal
        isOpen={true}
        onClose={() => {
          // Intentionally empty
        }}
        onReject={() => {
          // Intentionally empty
        }}
      />,
      STORE_MOCK,
    );

    expect(getByTestId('upgrade-cancel-reject-upgrade')).toBeInTheDocument();
    expect(getByTestId('upgrade-cancel-reject')).toBeInTheDocument();
  });

  it('calls onReject when reject transaction button is clicked', () => {
    const onReject = jest.fn();

    const { getByTestId } = renderWithConfirmContextProvider(
      <UpgradeCancelModal
        isOpen={true}
        onClose={() => {
          // Intentionally empty
        }}
        onReject={onReject}
      />,
      STORE_MOCK,
    );

    getByTestId('upgrade-cancel-reject').click();

    expect(onReject).toHaveBeenCalled();
  });

  it('rejects with not supported error when reject upgrade button is clicked', async () => {
    const onReject = jest.fn();

    const { getByTestId } = renderWithConfirmContextProvider(
      <UpgradeCancelModal
        isOpen={true}
        onClose={() => {
          // Intentionally empty
        }}
        onReject={onReject}
      />,
      STORE_MOCK,
    );

    await act(async () => {
      getByTestId('upgrade-cancel-reject-upgrade').click();
    });

    expect(rejectPendingApprovalMock).toHaveBeenCalledTimes(1);
    expect(rejectPendingApprovalMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ code: rpcErrors.methodNotSupported().code }),
    );
  });

  it('disables upgrade for chain when reject upgrade button is clicked', async () => {
    const onReject = jest.fn();
    const from = '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b';

    const { getByTestId } = renderWithConfirmContextProvider(
      <UpgradeCancelModal
        isOpen={true}
        onClose={() => {
          // Intentionally empty
        }}
        onReject={onReject}
      />,
      STORE_MOCK,
    );

    await act(async () => {
      getByTestId('upgrade-cancel-reject-upgrade').click();
    });

    expect(disableAccountUpgradeForChainAndAddressMock).toHaveBeenCalledTimes(
      1,
    );
    expect(disableAccountUpgradeForChainAndAddressMock).toHaveBeenCalledWith(
      CHAIN_ID,
      from,
    );
  });
});
