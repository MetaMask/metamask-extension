import React from 'react';
import { render, screen } from '@testing-library/react';
import RampsInfoModal from './ramps-info-modal';

describe('RampsInfoModal', () => {
  it('renders the given testId, title, and body', () => {
    render(
      <RampsInfoModal testId="some-modal" title="Title" body="Body copy" />,
    );
    expect(screen.getByTestId('some-modal')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body copy')).toBeInTheDocument();
  });
});
