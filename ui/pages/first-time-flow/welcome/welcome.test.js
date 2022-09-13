import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Welcome from './welcome.container';

describe('Welcome', () => {
  afterAll(() => {
    sinon.restore();
  });

  it('routes to the metametrics screen when participateInMetaMetrics is not initialized', () => {
    const props = {
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

  it('routes to select action when participateInMetaMetrics is initialized', () => {
    const props = {
      welcomeScreenSeen: true,
      participateInMetaMetrics: false,
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
