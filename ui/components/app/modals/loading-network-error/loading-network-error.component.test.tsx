import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import LoadingNetworkError from './loading-network-error.component';

describe('LoadingNetworkError Component', () => {
  const props = {
    hideModal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderWithProvider(
      <LoadingNetworkError {...props} />,
    );
    expect(container).toBeInTheDocument();
  });

  it('renders the "Try again" submit button', () => {
    const { getByText } = renderWithProvider(
      <LoadingNetworkError {...props} />,
    );
    expect(getByText('Try again')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    const { getByText } = renderWithProvider(
      <LoadingNetworkError {...props} />,
    );
    expect(getByText("We couldn't load this page.")).toBeInTheDocument();
  });

  it('calls hideModal when submit button is clicked', () => {
    const { getByText } = renderWithProvider(
      <LoadingNetworkError {...props} />,
    );
    fireEvent.click(getByText('Try again'));
    expect(props.hideModal).toHaveBeenCalledTimes(1);
  });
});
