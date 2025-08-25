import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import ShieldEntryModal from './shield-entry-modal';

describe('Shield Entry Modal', () => {
  const onCloseStub = jest.fn();
  const onGetStartedStub = jest.fn();

  it('should render', () => {
    const { getByTestId } = renderWithProvider(
      <ShieldEntryModal
        onClose={onCloseStub}
        onGetStarted={onGetStartedStub}
      />,
    );

    const shieldEntryModal = getByTestId('shield-entry-modal');
    expect(shieldEntryModal).toBeInTheDocument();
  });

  it('should call onClose when the skip button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <ShieldEntryModal
        onClose={onCloseStub}
        onGetStarted={onGetStartedStub}
      />,
    );

    const skipButton = getByTestId('shield-entry-modal-skip-button');
    fireEvent.click(skipButton);
    expect(onCloseStub).toHaveBeenCalled();
  });

  it('should call onGetStarted when the get started button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <ShieldEntryModal
        onClose={onCloseStub}
        onGetStarted={onGetStartedStub}
      />,
    );

    const getStartedButton = getByTestId(
      'shield-entry-modal-get-started-button',
    );
    fireEvent.click(getStartedButton);
    expect(onCloseStub).toHaveBeenCalled();
  });
});
