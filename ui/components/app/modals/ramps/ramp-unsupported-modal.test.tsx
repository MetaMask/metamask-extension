import React from 'react';
import { render, screen } from '@testing-library/react';
import RampUnsupportedModal from './ramp-unsupported-modal';

describe('RampUnsupportedModal', () => {
  it('renders a placeholder body', () => {
    render(<RampUnsupportedModal />);
    expect(screen.getByTestId('ramp-unsupported-modal')).toBeInTheDocument();
  });
});
