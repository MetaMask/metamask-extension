import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import reactRouterDom from 'react-router-dom';
import thunk from 'redux-thunk';
import { PairingKeyStatus } from '@metamask/desktop/dist/types';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  DESKTOP_ERROR_ROUTE,
  DESKTOP_PAIRING_ROUTE,
} from '../../../helpers/constants/routes';
import actions from '../../../store/actions';
import { EXTENSION_ERROR_PAGE_TYPES } from '../../../../shared/constants/desktop';
import DesktopEnableButton from './desktop-enable-button.component';

const mockHideLoadingIndication = jest.fn();
const mockShowLoadingIndication = jest.fn();
const mockSetDesktopEnabled = jest.fn();

jest.mock('../../../store/actions', () => {
  return {
    hideLoadingIndication: () => mockHideLoadingIndication,
    showLoadingIndication: () => mockShowLoadingIndication,
    setDesktopEnabled: () => mockSetDesktopEnabled,
    testDesktopConnection: jest.fn(),
    disableDesktop: jest.fn(),
  };
});

const mockedActions = actions;

describe('Desktop Enable Button', () => {
  const mockHistoryPush = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: mockHistoryPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const store = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<DesktopEnableButton />, store);
    expect(container).toMatchSnapshot();
  });

  describe('Click enable button', () => {
    it('succefully routes to otp pairing page', async () => {
      mockedActions.testDesktopConnection.mockResolvedValue({
        isConnected: true,
        versionCheck: {
          extensionVersion: 'dummyVersion',
          desktopVersion: 'dummyVersion',
          isExtensionVersionValid: true,
          isDesktopVersionValid: true,
        },
      });

      act(() => {
        renderWithProvider(<DesktopEnableButton />, store);
      });

      const [enableDesktopButton] = screen.queryAllByText('Enable Desktop App');

      act(() => {
        fireEvent.click(enableDesktopButton);
      });

      await waitFor(() => {
        expect(mockedActions.testDesktopConnection).toHaveBeenCalledTimes(1);
      });

      expect(mockShowLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHideLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledWith(`${DESKTOP_PAIRING_ROUTE}`);
    });

    it('routes to pairing key error page when pairing does not match', async () => {
      mockedActions.testDesktopConnection.mockResolvedValue({
        isConnected: false,
        pairingKeyCheck: PairingKeyStatus.NO_MATCH,
      });

      act(() => {
        renderWithProvider(<DesktopEnableButton />, store);
      });

      const [enableDesktopButton] = screen.queryAllByText('Enable Desktop App');

      act(() => {
        fireEvent.click(enableDesktopButton);
      });

      await waitFor(() => {
        expect(mockedActions.testDesktopConnection).toHaveBeenCalledTimes(1);
      });

      expect(mockShowLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHideLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.PAIRING_KEY_NOT_MATCH}`,
      );
    });

    it('routes to pairing key error page when fails to connect', async () => {
      mockedActions.testDesktopConnection.mockResolvedValue({
        isConnected: false,
      });

      act(() => {
        renderWithProvider(<DesktopEnableButton />, store);
      });

      const [enableDesktopButton] = screen.queryAllByText('Enable Desktop App');

      act(() => {
        fireEvent.click(enableDesktopButton);
      });

      await waitFor(() => {
        expect(mockedActions.testDesktopConnection).toHaveBeenCalledTimes(1);
      });

      expect(mockShowLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHideLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.NOT_FOUND}`,
      );
    });

    it('routes to pairing key error page when extension version is not supported', async () => {
      mockedActions.testDesktopConnection.mockResolvedValue({
        isConnected: true,
        versionCheck: {
          isExtensionVersionValid: false,
        },
      });
      act(() => {
        renderWithProvider(<DesktopEnableButton />, store);
      });

      const [enableDesktopButton] = screen.queryAllByText('Enable Desktop App');

      act(() => {
        fireEvent.click(enableDesktopButton);
      });

      await waitFor(() => {
        expect(mockedActions.testDesktopConnection).toHaveBeenCalledTimes(1);
      });

      expect(mockShowLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHideLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.EXTENSION_OUTDATED}`,
      );
    });

    it('routes to pairing key error page when desktop version is not supported', async () => {
      mockedActions.testDesktopConnection.mockResolvedValue({
        isConnected: true,
        versionCheck: {
          isExtensionVersionValid: true,
          isDesktopVersionValid: false,
        },
      });

      act(() => {
        renderWithProvider(<DesktopEnableButton />, store);
      });

      const [enableDesktopButton] = screen.queryAllByText('Enable Desktop App');

      act(() => {
        fireEvent.click(enableDesktopButton);
      });

      await waitFor(() => {
        expect(mockedActions.testDesktopConnection).toHaveBeenCalledTimes(1);
      });

      expect(mockShowLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHideLoadingIndication).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledTimes(1);
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `${DESKTOP_ERROR_ROUTE}/${EXTENSION_ERROR_PAGE_TYPES.DESKTOP_OUTDATED}`,
      );
    });
  });

  describe('Click disable button', () => {
    it('succefully dispatches disable desktop action when desktop is enabled', async () => {
      const desktopEnabledStore = configureMockStore([thunk])({
        ...mockState,
        metamask: { ...mockState, desktopEnabled: true },
      });

      act(() => {
        renderWithProvider(<DesktopEnableButton />, desktopEnabledStore);
      });

      const [disableDesktopButton] = screen.queryAllByText(
        'Disable Desktop App',
      );

      act(() => {
        fireEvent.click(disableDesktopButton);
      });

      await waitFor(() => {
        expect(mockedActions.disableDesktop).toHaveBeenCalledTimes(1);
      });

      expect(mockSetDesktopEnabled).toHaveBeenCalledTimes(1);
      expect(mockShowLoadingIndication).not.toHaveBeenCalled();
      expect(mockedActions.testDesktopConnection).not.toHaveBeenCalled();
      expect(mockHideLoadingIndication).not.toHaveBeenCalled();
      expect(mockHistoryPush).not.toHaveBeenCalled();
    });
  });
});
