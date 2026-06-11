import React from 'react';
import { render } from '@testing-library/react';
import { StatusIcon } from './status-icon';

const states = ['loading', 'success', 'fail'] as const;

describe('StatusIcon', () => {
  for (const state of states) {
    it(`renders for ${state} status`, () => {
      const { container } = render(<StatusIcon state={state} />);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('animates the loading state', () => {
    const { container } = render(<StatusIcon state="loading" />);
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('does not animate terminal states', () => {
    const { container } = render(<StatusIcon state="success" />);
    expect(container.querySelector('.animate-spin')).toBeNull();
  });
});
