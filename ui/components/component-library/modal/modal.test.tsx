/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React, { useContext } from 'react';

import { Modal } from './modal';
import { MetaMetricsContext } from '../../../contexts/metametrics';

describe('Modal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('should render the Modal without crashing', () => {
    const { getByText, getByTestId } = render(
      <Modal onClose={onClose} isOpen data-testid="modal">
        <div>modal content</div>
      </Modal>,
    );
    expect(getByText('modal content')).toBeDefined();
    expect(getByTestId('modal')).toHaveClass('mm-modal');
  });

  it('should match snapshot', () => {
    const { getByTestId } = render(
      <Modal onClose={onClose} isOpen={true} data-testid="test">
        <div>modal content</div>
      </Modal>,
    );
    expect(getByTestId('test')).toMatchSnapshot();
  });

  it('should render with and additional className', () => {
    const { getByTestId } = render(
      <Modal
        onClose={onClose}
        isOpen
        className="test-class"
        data-testid="modal"
      >
        <div>modal content</div>
      </Modal>,
    );
    expect(getByTestId('modal')).toHaveClass('mm-modal test-class');
  });

  it('should render the modal when isOpen is true', () => {
    const { getByText } = render(
      <Modal isOpen={true} onClose={onClose}>
        <div>modal content</div>
      </Modal>,
    );

    const modalContent = getByText('modal content');
    expect(modalContent).toBeInTheDocument();
  });

  it('should not render the modal when isOpen is false', () => {
    const { queryByText } = render(
      <Modal isOpen={false} onClose={onClose}>
        <div>modal content</div>
      </Modal>,
    );

    const modalContent = queryByText('modal content');
    expect(modalContent).not.toBeInTheDocument();
  });

  it('should call the onClose callback when clicking the close button', () => {
    const { getByText } = render(
      <Modal isOpen={true} onClose={onClose}>
        <div>modal content</div>
        <button onClick={() => onClose()}>Close</button>
      </Modal>,
    );

    const closeButton = getByText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should preserve MetaMetrics context through the portal', () => {
    const mockTrackEvent = jest.fn();

    // Component that uses MetaMetrics context
    const TestComponent = () => {
      const trackEvent = useContext(MetaMetricsContext);
      return (
        <button
          onClick={() =>
            trackEvent({ event: 'test_event', category: 'test_category' })
          }
        >
          Track Event
        </button>
      );
    };

    const { getByText } = render(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <Modal isOpen={true} onClose={onClose}>
          <TestComponent />
        </Modal>
      </MetaMetricsContext.Provider>,
    );

    const trackButton = getByText('Track Event');
    fireEvent.click(trackButton);

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: 'test_event',
      category: 'test_category',
    });
  });
});
