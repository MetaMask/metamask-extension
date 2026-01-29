import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useTransferRecipient } from '../hooks/useTransferRecipient';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../../../shared/constants/app';
import { ConfirmInfoRowAddress } from '../../../../../../components/app/confirm/info/row';
import { TransactionFlowSection } from './transaction-flow-section';

jest.mock('../hooks/useTransferRecipient');

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext.tsx',
  () => ({
    useAlertMetrics: () => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    }),
  }),
);

jest.mock('../../../../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../../../components/app/confirm/info/row', () => ({
  ...jest.requireActual('../../../../../../components/app/confirm/info/row'),
  ConfirmInfoRowAddress: jest.fn(() => null),
}));

describe('<TransactionFlowSection />', () => {
  const useTransferRecipientMock = jest.mocked(useTransferRecipient);
  const getEnvironmentTypeMock = jest.mocked(getEnvironmentType);
  const ConfirmInfoRowAddressMock = jest.mocked(ConfirmInfoRowAddress);

  beforeEach(() => {
    jest.resetAllMocks();

    useTransferRecipientMock.mockReturnValue(
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    );
    getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    ConfirmInfoRowAddressMock.mockImplementation(() => (
      <div data-testid="mock-address" />
    ));
  });

  it('renders correctly', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  describe('showFullName prop based on environment type', () => {
    it('passes showFullName=true to both From and To in fullscreen mode', () => {
      getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

      const state = getMockTokenTransferConfirmState({});
      const mockStore = configureMockStore([])(state);
      renderWithConfirmContextProvider(<TransactionFlowSection />, mockStore);

      expect(ConfirmInfoRowAddressMock).toHaveBeenCalledTimes(2);
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ showFullName: true }),
        expect.anything(),
      );
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ showFullName: true }),
        expect.anything(),
      );
    });

    it('passes showFullName=true to both From and To in sidepanel mode', () => {
      getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

      const state = getMockTokenTransferConfirmState({});
      const mockStore = configureMockStore([])(state);
      renderWithConfirmContextProvider(<TransactionFlowSection />, mockStore);

      expect(ConfirmInfoRowAddressMock).toHaveBeenCalledTimes(2);
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ showFullName: true }),
        expect.anything(),
      );
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ showFullName: true }),
        expect.anything(),
      );
    });

    it('passes showFullName=false to both From and To in popup mode', () => {
      getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

      const state = getMockTokenTransferConfirmState({});
      const mockStore = configureMockStore([])(state);
      renderWithConfirmContextProvider(<TransactionFlowSection />, mockStore);

      expect(ConfirmInfoRowAddressMock).toHaveBeenCalledTimes(2);
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ showFullName: false }),
        expect.anything(),
      );
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ showFullName: false }),
        expect.anything(),
      );
    });

    it('passes showFullName=false to both From and To in notification mode', () => {
      getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);

      const state = getMockTokenTransferConfirmState({});
      const mockStore = configureMockStore([])(state);
      renderWithConfirmContextProvider(<TransactionFlowSection />, mockStore);

      expect(ConfirmInfoRowAddressMock).toHaveBeenCalledTimes(2);
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ showFullName: false }),
        expect.anything(),
      );
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ showFullName: false }),
        expect.anything(),
      );
    });

    it('passes showFullName=false to both From and To in background mode', () => {
      getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_BACKGROUND);

      const state = getMockTokenTransferConfirmState({});
      const mockStore = configureMockStore([])(state);
      renderWithConfirmContextProvider(<TransactionFlowSection />, mockStore);

      expect(ConfirmInfoRowAddressMock).toHaveBeenCalledTimes(2);
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ showFullName: false }),
        expect.anything(),
      );
      expect(ConfirmInfoRowAddressMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ showFullName: false }),
        expect.anything(),
      );
    });
  });
});
