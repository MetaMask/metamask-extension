import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import MetaMetricsOptIn from '.';

describe('MetaMetrics Opt In', () => {
  const props = {
    setParticipateInMetaMetrics: jest.fn().mockResolvedValue(),
    hideModal: jest.fn(),
    participateInMetaMetrics: null,
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <MetaMetricsOptIn.WrappedComponent />,
    );

    expect(container).toMatchSnapshot();
  });

  it('passes false to setParticipateInMetaMetrics and hides modal', async () => {
    const { queryByText } = renderWithProvider(
      <MetaMetricsOptIn.WrappedComponent {...props} />,
    );

    fireEvent.click(queryByText('[noThanks]'));

    await waitFor(() => {
      expect(props.setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
      expect(props.hideModal).toHaveBeenCalled();
    });
  });

  it('passes true to setParticipateInMetaMetrics and hides modal', async () => {
    const { queryByText } = renderWithProvider(
      <MetaMetricsOptIn.WrappedComponent {...props} />,
    );

    fireEvent.click(queryByText('[affirmAgree]'));

    await waitFor(() => {
      expect(props.setParticipateInMetaMetrics).toHaveBeenCalledWith(true);
      expect(props.hideModal).toHaveBeenCalled();
    });
  });
});
