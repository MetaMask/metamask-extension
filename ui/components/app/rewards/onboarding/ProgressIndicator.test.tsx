import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProgressIndicator from './ProgressIndicator';

jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: jest.fn(() => 'light'),
}));

const mockedUseTheme = jest.requireMock('../../../../hooks/useTheme')
  .useTheme as jest.Mock;

describe('ProgressIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the correct number of indicators for total steps', () => {
    mockedUseTheme.mockReturnValue('light');
    render(<ProgressIndicator totalSteps={4} currentStep={1} />);

    const container = screen.getByTestId('progress-indicator-container');
    expect(container).toBeInTheDocument();
    expect(container.childElementCount).toBe(4);
  });

  describe('when theme is light', () => {
    it('marks the current step as active with wide width and black background', () => {
      mockedUseTheme.mockReturnValue('light');
      render(<ProgressIndicator totalSteps={4} currentStep={2} />);

      const container = screen.getByTestId('progress-indicator-container');
      const items = Array.from(container.children) as HTMLElement[];
      expect(items).toHaveLength(4);

      // Active is index 1 (currentStep - 1)
      const active = items[1];
      expect(active).toHaveClass('w-6');
      expect(active).toHaveClass('bg-black');

      // All others are inactive and small/muted
      items.forEach((item, idx) => {
        if (idx !== 1) {
          expect(item).toHaveClass('w-3');
          expect(item).toHaveClass('bg-muted');
          expect(item).not.toHaveClass('w-6');
          expect(item).not.toHaveClass('bg-black');
        }
      });
    });
  });

  describe('when theme is dark', () => {
    it('marks the current step as active with wide width and white background', () => {
      mockedUseTheme.mockReturnValue('dark');
      render(<ProgressIndicator totalSteps={3} currentStep={3} />);

      const container = screen.getByTestId('progress-indicator-container');
      const items = Array.from(container.children) as HTMLElement[];
      expect(items).toHaveLength(3);

      // Active is index 2 (currentStep - 1)
      const active = items[2];
      expect(active).toHaveClass('w-6');
      expect(active).toHaveClass('bg-white');

      // Other items are inactive
      items.slice(0, 2).forEach((item) => {
        expect(item).toHaveClass('w-3');
        expect(item).toHaveClass('bg-muted');
        expect(item).not.toHaveClass('w-6');
        expect(item).not.toHaveClass('bg-white');
      });
    });
  });
});
