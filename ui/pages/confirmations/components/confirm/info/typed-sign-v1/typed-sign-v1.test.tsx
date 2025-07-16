import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';

import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { getMockTypedSignConfirmStateForRequest } from '../../../../../../../test/data/confirmations/helper';
import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import * as snapUtils from '../../../../../../helpers/utils/snaps';
import TypedSignInfoV1 from './typed-sign-v1';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../../node_modules/@metamask/snaps-utils', () => {
  const originalUtils = jest.requireActual(
    '../../../../../../../node_modules/@metamask/snaps-utils',
  );
  return {
    ...originalUtils,
    stripSnapPrefix: jest.fn().mockReturnValue('@metamask/examplesnap'),
    getSnapPrefix: jest.fn().mockReturnValue('npm:'),
  };
});

jest.mock('../../../../../../helpers/utils/snaps', () => ({
  isSnapId: jest.fn(),
}));

describe('TypedSignInfo', () => {
  it('correctly renders typed sign data request', () => {
    const mockState = getMockTypedSignConfirmStateForRequest(
      unapprovedTypedSignMsgV1,
    );
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfoV1 />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render if required data is not present in the transaction', () => {
    const mockState = getMockTypedSignConfirmStateForRequest({
      id: '123',
      type: TransactionType.signTypedData,
      chainId: '0x5',
    });
    const mockStore = configureMockStore([])(mockState);
    const { container } = renderWithConfirmContextProvider(
      <TypedSignInfoV1 />,
      mockStore,
    );
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('displays "requestFromInfoSnap" tooltip when origin is a snap', async () => {
    const mockState = getMockTypedSignConfirmStateForRequest({
      id: '123',
      type: TransactionType.signTypedData,
      chainId: '0x5',
    });
    (snapUtils.isSnapId as jest.Mock).mockReturnValue(true);
    const mockStore = configureMockStore([])(mockState);
    const { queryByText } = renderWithConfirmContextProvider(
      <TypedSignInfoV1 />,
      mockStore,
    );

    const requestFromLabel = queryByText('Request from');

    await requestFromLabel?.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );
    expect(
      queryByText('This is the Snap asking for your signature.'),
    ).toBeDefined();
  });

  it('displays "requestFromInfo" tooltip when origin is not a snap', async () => {
    const mockState = getMockTypedSignConfirmStateForRequest({
      id: '123',
      type: TransactionType.signTypedData,
      chainId: '0x5',
    });
    (snapUtils.isSnapId as jest.Mock).mockReturnValue(false);
    const mockStore = configureMockStore([])(mockState);
    const { queryByText } = renderWithConfirmContextProvider(
      <TypedSignInfoV1 />,
      mockStore,
    );

    const requestFromLabel = queryByText('Request from');

    await requestFromLabel?.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );
    expect(
      queryByText('This is the site asking for your signature.'),
    ).toBeDefined();
  });
});
