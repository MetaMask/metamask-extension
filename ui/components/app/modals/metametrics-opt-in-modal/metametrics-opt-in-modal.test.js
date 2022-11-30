import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { METAMETRICS_PARTICIPATION } from '../../../../../shared/constants/metametrics';
import MetaMetricsOptIn from '.';

describe('MetaMetrics Opt In', () => {
  const props = {
    setMetaMetricsParticipationMode: jest.fn().mockResolvedValue(),
    hideModal: jest.fn(),
    metaMetricsParticipationMode: METAMETRICS_PARTICIPATION.NOT_CHOSEN,
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <MetaMetricsOptIn.WrappedComponent />,
    );

    expect(container).toMatchSnapshot();
  });

  it('calls setMetaMetricsParticipationMode with DO_NOT_PARTICIPATE and closes modal', async () => {
    const { queryByText } = renderWithProvider(
      <MetaMetricsOptIn.WrappedComponent {...props} />,
    );

    fireEvent.click(queryByText('[noThanks]'));

    await waitFor(() => {
      expect(props.setMetaMetricsParticipationMode).toHaveBeenCalledWith(
        METAMETRICS_PARTICIPATION.DO_NOT_PARTICIPATE,
      );
      expect(props.hideModal).toHaveBeenCalled();
    });
  });

  it('calls setMetaMetricsParticipationMode with PARTICIPAE and hides modal', async () => {
    const { queryByText } = renderWithProvider(
      <MetaMetricsOptIn.WrappedComponent {...props} />,
    );

    fireEvent.click(queryByText('[affirmAgree]'));

    await waitFor(() => {
      expect(props.setMetaMetricsParticipationMode).toHaveBeenCalledWith(
        METAMETRICS_PARTICIPATION.PARTICIPATE,
      );
      expect(props.hideModal).toHaveBeenCalled();
    });
  });
});
