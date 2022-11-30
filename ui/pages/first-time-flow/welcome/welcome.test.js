import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { METAMETRICS_PARTICIPATION } from '../../../../shared/constants/metametrics';
import Welcome from './welcome.container';

describe('Welcome', () => {
  afterAll(() => {
    sinon.restore();
  });

  it('routes to the metametrics screen when metaMetricsParticipationMode is NOT_CHOSEN', () => {
    const props = {
      metaMetricsParticipationMode: METAMETRICS_PARTICIPATION.NOT_CHOSEN,
      history: {
        push: sinon.spy(),
      },
    };

    renderWithProvider(<Welcome.WrappedComponent {...props} />);

    const getStartedButton = screen.getByTestId('first-time-flow__button');

    fireEvent.click(getStartedButton);

    expect(props.history.push.getCall(0).args[0]).toStrictEqual(
      '/initialize/metametrics-opt-in',
    );
  });

  it('routes to select action when metaMetricsParticipationMode is not NOT_CHOSEN', () => {
    const props = {
      welcomeScreenSeen: true,
      metaMetricsParticipationMode:
        METAMETRICS_PARTICIPATION.DO_NOT_PARTICIPATE,
      history: {
        push: sinon.spy(),
      },
    };

    renderWithProvider(<Welcome.WrappedComponent {...props} />);

    const getStartedButton = screen.getByTestId('first-time-flow__button');

    fireEvent.click(getStartedButton);
    expect(props.history.push.getCall(0).args[0]).toStrictEqual(
      '/initialize/select-action',
    );
  });
});
