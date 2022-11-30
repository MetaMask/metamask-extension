import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { METAMETRICS_PARTICIPATION } from '../../../../shared/constants/metametrics';
import MetaMetricsOptIn from './metametrics-opt-in.container';

describe('MetaMetricsOptIn', () => {
  it('opt out of MetaMetrics', () => {
    const props = {
      history: {
        push: sinon.spy(),
      },
      setMetaMetricsParticipationMode: sinon.stub().resolves(),
      metaMetricsParticipationMode:
        METAMETRICS_PARTICIPATION.DO_NOT_PARTICIPATE,
    };
    renderWithProvider(<MetaMetricsOptIn.WrappedComponent {...props} />);

    const noThanksButton = screen.getByTestId('page-container-footer-cancel');
    fireEvent.click(noThanksButton);
    expect(
      props.setMetaMetricsParticipationMode.calledOnceWithExactly(
        METAMETRICS_PARTICIPATION.DO_NOT_PARTICIPATE,
      ),
    ).toStrictEqual(true);
    sinon.resetHistory();
  });
});
