import React from 'react';
import { describe, it } from '@jest/globals';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import {
  CHAIN_IDS,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { isSnapId } from '@metamask/snaps-utils';
import {
  getMockConfirmStateForTransaction,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../../test/data/confirmations/helper';
import {
  permitSignatureMsg,
  permitSignatureMsgWithNoDeadline,
  transferWithAuthorizationSignatureMsg,
  unapprovedTypedSignMsgV3,
  unapprovedTypedSignMsgV4,
} from '../../../../../../../test/data/confirmations/typed_sign';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../../helpers/constants/design-system';
import { getTokenStandardAndDetailsByChain } from '../../../../../../store/actions';
import { PrimaryType } from '../../../../../../../shared/constants/signatures';
import { SignatureRequestType } from '../../../../types/confirm';
import { memoizedGetTokenStandardAndDetailsByChain } from '../../../../utils/token';
import TypedSignInfo from './typed-sign';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest.fn().mockResolvedValue({ decimals: 2 }),
    getTokenStandardAndDetailsByChain: jest.fn(),
    updateEventFragment: jest.fn(),
  };
});

jest.mock('../../../../../../../node_modules/@metamask/snaps-utils', () => {
  const originalUtils = jest.requireActual(
    '../../../../../../../node_modules/@metamask/snaps-utils',
  );
  return {
    ...originalUtils,
    stripSnapPrefix: jest.fn().mockReturnValue('@metamask/examplesnap'),
    getSnapPrefix: jest.fn().mockReturnValue('npm:'),
    isSnapId: jest.fn(),
  };
});

describe('TypedSignInfo', () => {
  it('renders origin for typed sign data request', () => {
    const state = getMockTypedSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const state = getMockConfirmStateForTransaction({
      id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
      status: TransactionStatus.unapproved,
      time: new Date().getTime(),
      type: TransactionType.contractInteraction,
      chainId: '0x5',
    });

    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v3 request', () => {
    const state = getMockTypedSignConfirmStateForRequest(
      unapprovedTypedSignMsgV3,
    );
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render message for typed sign v4 request', () => {
    const state = getMockTypedSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('display simulation details for permit signature if flag useTransactionSimulations is set', () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg, {
      metamask: {
        useTransactionSimulations: true,
      },
    });
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(getByText(messages.estimatedChanges.message)).toBeDefined();
  });

  it('correctly renders permit sign type', () => {
    const state = getMockTypedSignConfirmStateForRequest(permitSignatureMsg, {
      metamask: {
        useTransactionSimulations: true,
      },
    });
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('correctly renders permit sign type with no deadline', () => {
    const state = getMockTypedSignConfirmStateForRequest(
      permitSignatureMsgWithNoDeadline,
      {
        metamask: {
          useTransactionSimulations: true,
        },
      },
    );
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  describe.each([
    PrimaryType.TransferWithAuthorization,
    PrimaryType.ReceiveWithAuthorization,
  ])('%s', (primaryType) => {
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    const renderTransferAuthorization = (value: string) => {
      memoizedGetTokenStandardAndDetailsByChain.cache.clear?.();
      const { msgParams } = transferWithAuthorizationSignatureMsg;
      const typedData = JSON.parse(msgParams?.data as string);
      const data = JSON.stringify({
        ...typedData,
        primaryType,
        types: {
          EIP712Domain: typedData.types.EIP712Domain,
          [primaryType]: typedData.types.TransferWithAuthorization,
        },
        message: { ...typedData.message, value },
      });
      const state = getMockTypedSignConfirmStateForRequest({
        ...transferWithAuthorizationSignatureMsg,
        msgParams: { ...msgParams, data },
      } as SignatureRequestType);

      return renderWithConfirmContextProvider(
        <TypedSignInfo />,
        configureMockStore([])(state),
      );
    };

    it('shows value in the verifyingContract token units', async () => {
      jest
        .mocked(getTokenStandardAndDetailsByChain)
        .mockResolvedValueOnce({ decimals: '2', standard: 'ERC20' });

      const { getByTestId } = renderTransferAuthorization('123456');

      await waitFor(() => {
        expect(
          getByTestId('confirmation_data-value-index-2'),
        ).toHaveTextContent(/^Value:1,234\.56$/u);
      });
      expect(getTokenStandardAndDetailsByChain).toHaveBeenCalledWith(
        USDC_ADDRESS,
        undefined,
        undefined,
        CHAIN_IDS.MAINNET,
      );
    });

    it('shows value in base units if the token decimals are unavailable', async () => {
      jest
        .mocked(getTokenStandardAndDetailsByChain)
        .mockRejectedValueOnce(new Error('Token not found'));

      const { getByTestId } = renderTransferAuthorization('123456');

      await waitFor(() => {
        expect(getTokenStandardAndDetailsByChain).toHaveBeenCalled();
      });
      expect(getByTestId('confirmation_data-value-index-2')).toHaveTextContent(
        /^Value:123,456$/u,
      );
    });
  });

  it('displays "requestFromInfoSnap" tooltip when origin is a snap', async () => {
    const mockState = getMockTypedSignConfirmStateForRequest({
      ...unapprovedTypedSignMsgV4,
      id: '123',
      type: TransactionType.signTypedData,
      chainId: '0x5',
    });
    (isSnapId as unknown as jest.Mock).mockReturnValue(true);
    const mockStore = configureMockStore([])(mockState);
    const { queryByText } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );

    const requestFromLabel = queryByText(messages.requestFrom.message);

    await requestFromLabel?.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );
    expect(queryByText(messages.requestFromInfoSnap.message)).toBeDefined();
  });

  it('displays "requestFromInfo" tooltip when origin is not a snap', async () => {
    const mockState = getMockTypedSignConfirmStateForRequest({
      ...unapprovedTypedSignMsgV4,
      id: '123',
      type: TransactionType.signTypedData,
      chainId: '0x5',
    });
    (isSnapId as unknown as jest.Mock).mockReturnValue(false);
    const mockStore = configureMockStore([])(mockState);
    const { queryByText } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );

    const requestFromLabel = queryByText(messages.requestFrom.message);

    await requestFromLabel?.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );
    expect(queryByText(messages.requestFromInfo.message)).toBeDefined();
  });

  it('display network info if there is an alert on that field', () => {
    const state = {
      ...getMockTypedSignConfirmStateForRequest(unapprovedTypedSignMsgV4),
      confirmAlerts: {
        alerts: {
          [unapprovedTypedSignMsgV4.id]: [
            {
              key: 'networkSwitchInfo',
              field: RowAlertKey.Network,
              severity: Severity.Info,
              message: 'dummy message',
              reason: 'dummy reason',
            },
          ],
        },
        confirmed: {},
      },
    };
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <TypedSignInfo />,
      mockStore,
    );
    expect(getByText(messages.network.message)).toBeInTheDocument();
    expect(getByText(messages.networkNameGoerli.message)).toBeInTheDocument();
  });
});
