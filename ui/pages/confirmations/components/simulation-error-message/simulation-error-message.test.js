import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import SimulationErrorMessage from './simulation-error-message';

describe('Simulation Error Message', () => {
  const store = configureMockStore()({});
  let props = {};

  beforeEach(() => {
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
});
