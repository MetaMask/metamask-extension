import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { MetamaskNotificationsProvider } from '../../../../contexts/metamask-notifications/metamask-notifications';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import * as modalPropsHooks from '../../../../hooks/useModalProps';
import TurnOnMetamaskNotifications from './turn-on-metamask-notifications';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

describe('TurnOnMetamaskNotifications', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = renderWithProvider(
      <MetamaskNotificationsProvider>
        <TurnOnMetamaskNotifications />
      </MetamaskNotificationsProvider>,
      configureMockStore()({
        ...mockStore,
      }),
    );
    expect(getByText('Turn on')).toBeInTheDocument();
  });

  it('tracks dismissal before hiding the modal', async () => {
    const hideModalSpy = jest.fn();
    const useModalPropsSpy = jest
      .spyOn(modalPropsHooks, 'useModalProps')
      .mockReturnValue({ props: {}, hideModal: hideModalSpy });

    const trackEventSpy = jest.fn().mockResolvedValue(undefined);

    try {
      const { findByRole } = renderWithProvider(
        <MetaMetricsContext.Provider
          value={{
            trackEvent: trackEventSpy,
            bufferedTrace: jest.fn(),
            bufferedEndTrace: jest.fn(),
            onboardingParentContext: { current: null },
          }}
        >
          <MetamaskNotificationsProvider>
            <TurnOnMetamaskNotifications />
          </MetamaskNotificationsProvider>
        </MetaMetricsContext.Provider>,
        configureMockStore()({
          ...mockStore,
        }),
      );

      fireEvent.click(await findByRole('button', { name: 'Close' }));

      expect(trackEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: MetaMetricsEventName.NotificationsActivated,
          properties: expect.objectContaining({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            action_type: 'dismissed',
          }),
        }),
      );
      expect(hideModalSpy).toHaveBeenCalled();

      expect(trackEventSpy.mock.invocationCallOrder[0]).toBeLessThan(
        hideModalSpy.mock.invocationCallOrder[0],
      );
    } finally {
      useModalPropsSpy.mockRestore();
    }
  });
});
