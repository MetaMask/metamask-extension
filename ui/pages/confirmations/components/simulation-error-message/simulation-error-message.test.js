import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
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
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).toBeInTheDocument();
  });

  it('should render SimulationErrorMessage component without I want to procced anyway link', () => {
    props.userAcknowledgedGasMissing = true;
    const { queryByText } = renderWithProvider(
      <SimulationErrorMessage {...props} />,
      store,
    );

    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();
  });

  it('should render SimulationErrorMessage component with I want to proceed anyway and fire that event', () => {
    props.userAcknowledgedGasMissing = false;
    const { queryByText, getByText } = renderWithProvider(
      <SimulationErrorMessage {...props} />,
      store,
    );

    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).toBeInTheDocument();

    const proceedAnywayLink = getByText('I want to proceed anyway');
    fireEvent.click(proceedAnywayLink);
    expect(props.setUserAcknowledgedGasMissing).toHaveBeenCalledTimes(1);
  });
});
