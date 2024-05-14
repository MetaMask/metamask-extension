import { fireEvent, waitFor } from '@testing-library/react';
import mockMetaMaskState from '../../../data/integration-init-state.json';
import {
  integrationTestRenderWithProvider,
} from '../../../lib/render-helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventLocation,
} from '../../../../shared/constants/metametrics';
import { ApprovalType } from '@metamask/controller-utils';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBakcgroundConnection = backgroundConnection as jest.Mocked<
  typeof backgroundConnection
>;

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

describe('PersonalSign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('displays the header account modal with correct data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
      ];

    const accountName = account.metadata.name;
    const pendingPersonalSignTime = new Date().getTime();
    const pendingPersonalSignId = '0050d5b0-c023-11ee-a0cb-3390a510a0ab';
    const mockedMetaMaskState = {
      ...mockMetaMaskState,
      preferences: {
        ...mockMetaMaskState.preferences,
        redesignedConfirmationsEnabled: true,
      },
      unapprovedPersonalMsgs: {
        [pendingPersonalSignId]: {
          id: pendingPersonalSignId,
          status: 'unapproved',
          time: pendingPersonalSignTime,
          type: 'personal_sign',
          securityProviderResponse: null,
          msgParams: {
            from: account.address,
            data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
            origin: 'https://metamask.github.io',
            siwe: { isSIWEMessage: false, parsedMessage: null },
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

    const { getByTestId, queryByTestId } =
      await integrationTestRenderWithProvider({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });

    expect(getByTestId('header-account-name')).toHaveTextContent(accountName);
    expect(getByTestId('header-network-display-name')).toHaveTextContent(
      'Chain 5',
    );

    fireEvent.click(getByTestId('header-info__account-details-button'));

    await waitFor(() => {
      expect(
        getByTestId('header-info__account-details-modal__account-name'),
      ).toHaveTextContent(accountName);
      expect(getByTestId('address-copy-button-text')).toHaveTextContent(
        '0x0DCD5...3E7bc',
      );
      expect(
        getByTestId('header-info__account-details-modal__account-balance'),
      ).toHaveTextContent('1.58271596ETH');

      const confirmAccountDetailsModalMetricsEvent =
        mockedBakcgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );
      expect(confirmAccountDetailsModalMetricsEvent?.[0]).toBe(
        'trackMetaMetricsEvent',
      );
      expect(confirmAccountDetailsModalMetricsEvent?.[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: MetaMetricsEventCategory.Transactions,
            event: MetaMetricsEventName.AccountDetailsOpened,
            properties: {
              action: 'Confirm Screen',
              location: MetaMetricsEventLocation.SignatureConfirmation,
              signature_type: ApprovalType.PersonalSign,
            },
          }),
        ]),
      );
    });

    fireEvent.click(
      getByTestId('header-info__account-details-modal__close-button'),
    );

    await waitFor(() => {
      expect(
        queryByTestId('header-info__account-details-modal__account-name'),
      ).not.toBeInTheDocument();
    });
  });

  it('displays the expected title data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
      ];

    const pendingPersonalSignTime = new Date().getTime();
    const pendingPersonalSignId = '0050d5b0-c023-11ee-a0cb-3390a510a0ab';
    const mockedMetaMaskState = {
      ...mockMetaMaskState,
      preferences: {
        ...mockMetaMaskState.preferences,
        redesignedConfirmationsEnabled: true,
      },
      unapprovedPersonalMsgs: {
        [pendingPersonalSignId]: {
          id: pendingPersonalSignId,
          status: 'unapproved',
          time: pendingPersonalSignTime,
          type: 'personal_sign',
          securityProviderResponse: null,
          msgParams: {
            from: account.address,
            data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
            origin: 'https://metamask.github.io',
            siwe: { isSIWEMessage: false, parsedMessage: null },
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

    const { getByText } = await integrationTestRenderWithProvider({
      preloadedState: mockedMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });

  it('displays the MMI header warning when account signing is not the same as the account selected', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts['07c2cfec-36c9-46c4-8115-3836d3ac9047'];
    const selectedAccount =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
      ];

    const pendingPersonalSignTime = new Date().getTime();
    const pendingPersonalSignId = '0050d5b0-c023-11ee-a0cb-3390a510a0ab';
    const mockedMetaMaskState = {
      ...mockMetaMaskState,
      preferences: {
        ...mockMetaMaskState.preferences,
        redesignedConfirmationsEnabled: true,
      },
      unapprovedPersonalMsgs: {
        [pendingPersonalSignId]: {
          id: pendingPersonalSignId,
          status: 'unapproved',
          time: pendingPersonalSignTime,
          type: 'personal_sign',
          securityProviderResponse: null,
          msgParams: {
            from: account.address,
            data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
            origin: 'https://metamask.github.io',
            siwe: { isSIWEMessage: false, parsedMessage: null },
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

    const { getByText, container } = await integrationTestRenderWithProvider({
      preloadedState: mockedMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    const mismatchAccountText = `Your selected account (${shortenAddress(
      selectedAccount.address,
    )}) is different than the account trying to sign (${shortenAddress(
      account.address,
    )})`;

    expect(getByText(mismatchAccountText)).toBeInTheDocument();
  });
});
