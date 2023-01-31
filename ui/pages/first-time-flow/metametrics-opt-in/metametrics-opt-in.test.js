import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import MetaMetricsOptIn from './metametrics-opt-in.container';

describe('MetaMetricsOptIn', () => {
  it('opt out of MetaMetrics', () => {
    const props = {
      history: {
        push: sinon.spy(),
      },
      setParticipateInMetaMetrics: sinon.stub().resolves(),
      participateInMetaMetrics: false,
    };
    renderWithProvider(<MetaMetricsOptIn.WrappedComponent {...props} />);

    const noThanksButton = screen.getByTestId('page-container-footer-cancel');
    fireEvent.click(noThanksButton);
    expect(
      props.setParticipateInMetaMetrics.calledOnceWithExactly(false),
    ).toStrictEqual(true);
    sinon.resetHistory();
  });
});
