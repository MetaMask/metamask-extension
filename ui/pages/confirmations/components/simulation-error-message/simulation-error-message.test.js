import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import SimulationErrorMessage from './simulation-error-message';

const mockTrackEvent = jest.fn();

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: jest.fn(() => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    })),
  };
});

const mockUseAnalytics = jest.mocked(useAnalytics);

describe('Simulation Error Message', () => {
  const store = configureMockStore()({});
  let props = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAnalytics.mockImplementation(() => ({
      trackEvent: mockTrackEvent,
      createEventBuilder: jest.requireActual(
        '../../../../../shared/lib/analytics/create-event-builder',
      ).createEventBuilder,
    }));
    props = {
      userAcknowledgedGasMissing: false,
      setUserAcknowledgedGasMissing: jest.fn(),
    };
  });

  it('should render SimulationErrorMessage component with I want to procced anyway link', () => {
    const { queryByText } = renderWithProvider(
      <SimulationErrorMessage {...props} />,
      store,
    );

    expect(
      queryByText(messages.simulationErrorMessageV2.message),
    ).toBeInTheDocument();
    expect(
      queryByText(messages.proceedWithTransaction.message),
    ).toBeInTheDocument();
  });

  it('should render SimulationErrorMessage component without I want to procced anyway link', () => {
    props.userAcknowledgedGasMissing = true;
    const { queryByText } = renderWithProvider(
      <SimulationErrorMessage {...props} />,
      store,
    );

    expect(
      queryByText(messages.simulationErrorMessageV2.message),
    ).toBeInTheDocument();
    expect(
      queryByText(messages.proceedWithTransaction.message),
    ).not.toBeInTheDocument();
  });

  it('should render SimulationErrorMessage component with I want to proceed anyway and fire that event', () => {
    props.userAcknowledgedGasMissing = false;
    const { queryByText, getByText } = renderWithProvider(
      <SimulationErrorMessage {...props} />,
      store,
    );

    expect(
      queryByText(messages.simulationErrorMessageV2.message),
    ).toBeInTheDocument();
    expect(
      queryByText(messages.proceedWithTransaction.message),
    ).toBeInTheDocument();

    const proceedAnywayLink = getByText(
      messages.proceedWithTransaction.message,
    );
    fireEvent.click(proceedAnywayLink);
    expect(props.setUserAcknowledgedGasMissing).toHaveBeenCalledTimes(1);
  });

  it('tracks SimulationFails once when trackEvent identity changes', () => {
    const { rerender } = renderWithProvider(
      <SimulationErrorMessage {...props} />,
      store,
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    const nextTrackEvent = jest.fn();
    mockUseAnalytics.mockReturnValue({
      trackEvent: nextTrackEvent,
      createEventBuilder: jest.requireActual(
        '../../../../../shared/lib/analytics/create-event-builder',
      ).createEventBuilder,
    });

    rerender(<SimulationErrorMessage {...props} />);

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(nextTrackEvent).not.toHaveBeenCalled();
  });
});
