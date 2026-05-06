import React from 'react';
import { render } from '@testing-library/react';
import MusdTokenMonitor from './musd-token-monitor';

const mockUseEnsureMusdTokenRegistered = jest.fn();

jest.mock('../../../hooks/musd/useEnsureMusdTokenRegistered', () => ({
  useEnsureMusdTokenRegistered: () => mockUseEnsureMusdTokenRegistered(),
}));

describe('MusdTokenMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing', () => {
    const { container } = render(<MusdTokenMonitor />);
    expect(container.firstChild).toBeNull();
  });

  it('calls useEnsureMusdTokenRegistered on mount', () => {
    render(<MusdTokenMonitor />);
    expect(mockUseEnsureMusdTokenRegistered).toHaveBeenCalledTimes(1);
  });
});
