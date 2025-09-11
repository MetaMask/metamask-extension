import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';
import { isSnapId } from '@metamask/snaps-utils';

import {
  getMockConfirmState,
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import {
  signatureRequestSIWE,
  unapprovedPersonalSignMsg,
} from '../../../../../../../test/data/confirmations/personal_sign';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../../helpers/constants/design-system';
import { SignatureRequestType } from '../../../../types/confirm';
import * as utils from '../../../../utils';
import PersonalSignInfo from './personal-sign';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../utils', () => {
  const originalUtils = jest.requireActual('../../../../utils');
  return {
    ...originalUtils,
    isSIWESignatureRequest: jest.fn().mockReturnValue(false),
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

describe('PersonalSignInfo', () => {
  it('renders correctly for personal sign request', () => {
    const state = getMockPersonalSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('handle reverse string properly', () => {
    const state = getMockTypedSignConfirmStateForRequest({
      id: '123',
      type: TransactionType.signTypedData,
      msgParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        data: '0x5369676e20696e746f20e280ae204556494c',
        origin: 'https://metamask.github.io',
        siwe: { isSIWEMessage: false, parsedMessage: null },
      },
    });
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('display signing in from for SIWE request', () => {
    (utils.isSIWESignatureRequest as jest.Mock).mockReturnValue(true);
    const state =
      getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE);
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );
    expect(getByText('Signing in with')).toBeDefined();
  });

  it('display simulation for SIWE request if preference useTransactionSimulations is enabled', () => {
    (utils.isSIWESignatureRequest as jest.Mock).mockReturnValue(true);
    const state = getMockPersonalSignConfirmStateForRequest(
      signatureRequestSIWE,
      {
        metamask: {
          useTransactionSimulations: true,
        },
      },
    );
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );
    expect(getByText('Estimated changes')).toBeDefined();
  });

  it('does not display tooltip text when isSIWE is true', async () => {
    const state =
      getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE); // isSIWE is true

    (utils.isSIWESignatureRequest as jest.Mock).mockReturnValue(true);
    const mockStore = configureMockStore([])(state);
    const { queryByText, getByText } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );

    const requestFromLabel = getByText('Request from');
    await requestFromLabel.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );

    expect(
      queryByText('This is the site asking for your signature.'),
    ).toBeNull();
    expect(
      queryByText('This is the Snap asking for your signature.'),
    ).toBeNull();
  });

  it('displays "requestFromInfoSnap" tooltip when isSIWE is false and origin is a snap', async () => {
    const state =
      getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE);

    (utils.isSIWESignatureRequest as jest.Mock).mockReturnValue(false);
    (isSnapId as unknown as jest.Mock).mockReturnValue(true);

    const mockStore = configureMockStore([])(state);
    const { queryByText, getByText } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );

    const requestFromLabel = getByText('Request from');
    await requestFromLabel.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );

    expect(
      queryByText('This is the Snap asking for your signature.'),
    ).toBeDefined();
  });

  it('displays "requestFromInfo" tooltip when isSIWE is false and origin is not a snap', async () => {
    const state =
      getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE);
    (utils.isSIWESignatureRequest as jest.Mock).mockReturnValue(false);
    (isSnapId as unknown as jest.Mock).mockReturnValue(true);

    const mockStore = configureMockStore([])(state);
    const { getByText, queryByText } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );

    const requestFromLabel = getByText('Request from');
    await requestFromLabel.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );

    expect(
      queryByText('This is the site asking for your signature.'),
    ).toBeDefined();
  });

  it('display hex message value if it can not be converted to valid UTF-8 string', () => {
    const message =
      '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';
    const state = getMockPersonalSignConfirmStateForRequest({
      ...unapprovedPersonalSignMsg,
      msgParams: {
        ...unapprovedPersonalSignMsg.msgParams,
        data: message,
      },
    } as SignatureRequestType);
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <PersonalSignInfo />,
      mockStore,
    );
    expect(getByText(message)).toBeDefined();
  });

  it('display network info if there is an alert on that field', () => {
    const state = {
      ...getMockPersonalSignConfirmStateForRequest({
        ...unapprovedPersonalSignMsg,
      } as SignatureRequestType),
      confirmAlerts: {
        alerts: {
          [unapprovedPersonalSignMsg.id]: [
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
      <PersonalSignInfo />,
      mockStore,
    );
    expect(getByText('Network')).toBeInTheDocument();
    expect(getByText('Goerli')).toBeInTheDocument();
  });
});
