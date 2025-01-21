import { ApprovalType } from '@metamask/controller-utils';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { useAssetDetails } from '../../../../ui/pages/confirmations/hooks/useAssetDetails';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../../ui/pages/confirmations/hooks/useAssetDetails', () => ({
  ...jest.requireActual(
    '../../../../ui/pages/confirmations/hooks/useAssetDetails',
  ),
  useAssetDetails: jest.fn().mockResolvedValue({
    decimals: '4',
  }),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const mockedAssetDetails = jest.mocked(useAssetDetails);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const getMetaMaskStateWithUnapprovedPersonalSign = (accountAddress: string) => {
  const pendingPersonalSignId = '0050d5b0-c023-11ee-a0cb-3390a510a0ab';
  const pendingPersonalSignTime = new Date().getTime();
  return {
    ...mockMetaMaskState,
    preferences: {
      ...mockMetaMaskState.preferences,
      redesignedConfirmationsEnabled: true,
    },
    unapprovedPersonalMsgs: {
      [pendingPersonalSignId]: {
        id: pendingPersonalSignId,
        chainId: CHAIN_IDS.SEPOLIA,
        status: 'unapproved',
        time: pendingPersonalSignTime,
        type: MESSAGE_TYPE.PERSONAL_SIGN,
        securityProviderResponse: null,
        msgParams: {
          from: accountAddress,
          data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
          origin: 'https://metamask.github.io',
          siwe: { isSIWEMessage: false, parsedMessage: null },
          signatureMethod: ApprovalType.PersonalSign,
        },
      },
    },
    unapprovedPersonalMsgCount: 1,
    pendingApprovals: {
      [pendingPersonalSignId]: {
        id: pendingPersonalSignId,
        origin: 'origin',
        time: pendingPersonalSignTime,
        type: ApprovalType.PersonalSign,
        requestData: {},
        requestState: null,
        expectsResult: false,
      },
    },
    pendingApprovalCount: 1,
  };
};

describe('PersonalSign Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAssetDetails.mockImplementation(() => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
  });

  it('displays the header account modal with correct data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;
    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPersonalSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(await screen.findByTestId('header-account-name')).toHaveTextContent(
      accountName,
    );
    expect(
      await screen.findByTestId('header-network-display-name'),
    ).toHaveTextContent('Sepolia');

    fireEvent.click(
      await screen.findByTestId('header-info__account-details-button'),
    );

    expect(
      await screen.findByTestId(
        'confirmation-account-details-modal__account-name',
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId(
        'confirmation-account-details-modal__account-name',
      ),
    ).toHaveTextContent(accountName);
    expect(
      await screen.findByTestId('address-copy-button-text'),
    ).toHaveTextContent('0x0DCD5...3E7bc');
    expect(
      await screen.findByTestId(
        'confirmation-account-details-modal__account-balance',
      ),
    ).toHaveTextContent('1.582717SepoliaETH');

    let confirmAccountDetailsModalMetricsEvent;

    await waitFor(() => {
      confirmAccountDetailsModalMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );
      expect(confirmAccountDetailsModalMetricsEvent?.[0]).toBe(
        'trackMetaMetricsEvent',
      );
    });

    expect(confirmAccountDetailsModalMetricsEvent?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: MetaMetricsEventCategory.Confirmations,
          event: MetaMetricsEventName.AccountDetailsOpened,
          properties: {
            action: 'Confirm Screen',
            location: MetaMetricsEventLocation.SignatureConfirmation,
            signature_type: ApprovalType.PersonalSign,
          },
        }),
      ]),
    );

    fireEvent.click(
      await screen.findByTestId(
        'confirmation-account-details-modal__close-button',
      ),
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId(
          'confirmation-account-details-modal__account-name',
        ),
      ).not.toBeInTheDocument();
    });
  });

  it('displays the expected title data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPersonalSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(await screen.findByText('Signature request')).toBeInTheDocument();
    expect(
      await screen.findByText('Review request details before you confirm.'),
    ).toBeInTheDocument();
  });

  it('displays the MMI header warning when account signing is not the same as the account selected', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        '07c2cfec-36c9-46c4-8115-3836d3ac9047'
      ];
    const selectedAccount =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPersonalSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const mismatchAccountText = `Your selected account (${shortenAddress(
      selectedAccount.address,
    )}) is different than the account trying to sign (${shortenAddress(
      account.address,
    )})`;

    expect(await screen.findByText(mismatchAccountText)).toBeInTheDocument();
  });
});
