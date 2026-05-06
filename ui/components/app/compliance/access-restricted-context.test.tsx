import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import {
  AccessRestrictedProvider,
  useAccessRestrictedModal,
} from './access-restricted-context';

const mockTrack = jest.fn();

jest.mock('../../../hooks/perps', () => ({
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

jest.mock('./access-restricted-modal', () => ({
  AccessRestrictedModal: ({
    isOpen,
    onClose,
    onContactSupport,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onContactSupport: () => void;
  }) =>
    isOpen ? (
      <div data-testid="access-restricted-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onContactSupport}>Contact support</button>
      </div>
    ) : null,
}));

// eslint-disable-next-line @typescript-eslint/naming-convention
function TestAccessRestrictedConsumer() {
  const { showAccessRestrictedModal } = useAccessRestrictedModal();
  return <button onClick={showAccessRestrictedModal}>Show restricted</button>;
}

describe('AccessRestrictedProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.platform = {
      openTab: jest.fn(),
    } as unknown as typeof globalThis.platform;
  });

  it('tracks the compliance block screen event when the modal is shown', () => {
    render(
      <AccessRestrictedProvider>
        <TestAccessRestrictedConsumer />
      </AccessRestrictedProvider>,
    );

    fireEvent.click(screen.getByText('Show restricted'));

    expect(screen.getByTestId('access-restricted-modal')).toBeInTheDocument();
    expect(mockTrack).toHaveBeenCalledWith(
      MetaMetricsEventName.PerpsScreenViewed,
      {
        [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
          PERPS_EVENT_VALUE.SCREEN_TYPE.COMPLIANCE_BLOCK_NOTIF,
      },
    );
  });
});
