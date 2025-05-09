import { waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  getMockApproveConfirmState,
  getMockConfirmStateForTransaction,
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
  getMockSetApprovalForAllConfirmState,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import {
  permitNFTSignatureMsg,
  permitSignatureMsg,
} from '../../../../../../test/data/confirmations/typed_sign';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import { upgradeAccountConfirmationOnly } from '../../../../../../test/data/confirmations/batch-transaction';
import {
  Alert,
  ConfirmAlertsState,
} from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Confirmation } from '../../../types/confirm';
import { useIsNFT } from '../info/approve/hooks/use-is-nft';
import ConfirmTitle from './title';

jest.mock('../info/approve/hooks/use-approve-token-simulation', () => ({
  useApproveTokenSimulation: jest.fn(() => ({
    spendingCap: '1000',
    formattedSpendingCap: '1000',
    value: '1000',
  })),
}));

jest.mock('../../../hooks/useAssetDetails', () => ({
  useAssetDetails: jest.fn(() => ({
    decimals: 18,
    userBalance: '1000000',
    tokenSymbol: 'TST',
  })),
}));

jest.mock('../info/approve/hooks/use-is-nft', () => ({
  useIsNFT: jest.fn(() => ({ isNFT: true })),
}));

jest.mock('../../../../../store/actions', () => ({
  getContractMethodData: jest.fn().mockReturnValue({ type: 'dummy' }),
  setAccountDetailsAddress: jest.fn().mockReturnValue({ type: 'dummy' }),
}));

describe('ConfirmTitle', () => {
  it('should render the title and description for a personal signature', () => {
    const mockStore = configureMockStore([])(getMockPersonalSignConfirmState);
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText('Review request details before you confirm.'),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a permit signature', () => {
    const mockStore = configureMockStore([])(
      getMockTypedSignConfirmStateForRequest(permitSignatureMsg),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Spending cap request')).toBeInTheDocument();
    expect(
      getByText('This site wants permission to spend your tokens.'),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a NFT permit signature', () => {
    const mockStore = configureMockStore([])(
      getMockTypedSignConfirmStateForRequest(permitNFTSignatureMsg),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Withdrawal request')).toBeInTheDocument();
    expect(
      getByText('This site wants permission to withdraw your NFTs'),
    ).toBeInTheDocument();
  });

  it('should render the title and description for smart account upgrade correctly', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmationOnly as Confirmation,
      ),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Account update')).toBeInTheDocument();
    expect(
      getByText("You're switching to a smart account"),
    ).toBeInTheDocument();
  });

  it('should render the title and description for typed signature', () => {
    const mockStore = configureMockStore([])(getMockTypedSignConfirmState());
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText('Review request details before you confirm.'),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a contract interaction transaction', () => {
    const mockStore = configureMockStore([])(
      getMockContractInteractionConfirmState(),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(
      getByText(tEn('confirmTitleTransaction') as string),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a approval transaction for NFTs', () => {
    const mockStore = configureMockStore([])(getMockApproveConfirmState());
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(
      getByText(tEn('confirmTitleApproveTransactionNFT') as string),
    ).toBeInTheDocument();
    expect(
      getByText(tEn('confirmTitleDescApproveTransaction') as string),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a approval transaction for erc20 tokens', () => {
    const mockedUseIsNFT = jest.mocked(useIsNFT);

    mockedUseIsNFT.mockImplementation(() => ({
      isNFT: false,
      pending: false,
    }));

    const mockStore = configureMockStore([])(getMockApproveConfirmState());
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    expect(
      getByText(tEn('confirmTitlePermitTokens') as string),
    ).toBeInTheDocument();
    expect(
      getByText(tEn('confirmTitleDescERC20ApproveTransaction') as string),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a setApprovalForAll transaction', async () => {
    const mockStore = configureMockStore([])(
      getMockSetApprovalForAllConfirmState(),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <ConfirmTitle />,
      mockStore,
    );

    await waitFor(() => {
      expect(
        getByText(tEn('setApprovalForAllRedesignedTitle') as string),
      ).toBeInTheDocument();

      expect(
        getByText(tEn('confirmTitleDescApproveTransaction') as string),
      ).toBeInTheDocument();
    });
  });

  describe('Alert banner', () => {
    const alertMock = {
      severity: Severity.Danger,
      message: 'mock message',
      reason: 'mock reason',
      key: 'mock key',
    };

    const alertMock2 = {
      ...alertMock,
      key: 'mock key 2',
      reason: 'mock reason 2',
    };
    const mockAlertState = (state: Partial<ConfirmAlertsState> = {}) =>
      getMockPersonalSignConfirmStateForRequest(unapprovedPersonalSignMsg, {
        metamask: {},
        confirmAlerts: {
          alerts: {
            [unapprovedPersonalSignMsg.id]: [alertMock, alertMock2],
          },
          confirmed: {
            [unapprovedPersonalSignMsg.id]: {
              [alertMock.key]: false,
              [alertMock2.key]: false,
            },
          },
          ...state,
        },
      });
    it('renders an alert banner if there is a danger alert', () => {
      const mockStore = configureMockStore([])(
        mockAlertState({
          alerts: {
            [unapprovedPersonalSignMsg.id]: [alertMock as Alert],
          },
        }),
      );
      const { queryByText } = renderWithConfirmContextProvider(
        <ConfirmTitle />,
        mockStore,
      );

      expect(queryByText(alertMock.reason)).toBeInTheDocument();
      expect(queryByText(alertMock.message)).toBeInTheDocument();
    });

    it('renders multiple alert banner when there are multiple alerts', () => {
      const mockStore = configureMockStore([])(mockAlertState());

      const { getByText } = renderWithConfirmContextProvider(
        <ConfirmTitle />,
        mockStore,
      );

      expect(getByText(alertMock.reason)).toBeInTheDocument();
      expect(getByText(alertMock2.reason)).toBeInTheDocument();
    });
  });
});
