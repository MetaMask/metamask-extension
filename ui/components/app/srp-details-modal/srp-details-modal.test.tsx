import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import SRPDetailsModal from './srp-details-modal';

describe('SRP Details Modal', () => {
  const onCloseStub = jest.fn();

  it('should render', () => {
    const { getByText } = renderWithProvider(
      <SRPDetailsModal onClose={onCloseStub} />,
    );

    const title = getByText('What’s a Secret Recovery Phrase?');
    expect(title).toBeInTheDocument();

    const gotItButton = getByText('Got it');
    expect(gotItButton).toBeInTheDocument();
  });

  it('onClose function is called when the button is clicked', () => {
    const { getByText } = renderWithProvider(
      <SRPDetailsModal onClose={onCloseStub} />,
    );

    const gotItButton = getByText('Got it');
    fireEvent.click(gotItButton);
    expect(onCloseStub).toHaveBeenCalled();
  });
});
