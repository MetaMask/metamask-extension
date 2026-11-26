import React from 'react';
import { render } from '@testing-library/react';
import { OfflineBanner } from './offline-banner';

const mockUseI18nContext = jest.fn(() => (key: string) => key);

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockUseI18nContext(),
}));

describe('OfflineBanner', () => {
  let mockNavigatorOnLine: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigatorOnLine = true;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => mockNavigatorOnLine,
    });
  });

  it('renders the banner when offline', () => {
    mockNavigatorOnLine = false;
    const { container, getByText } = render(<OfflineBanner />);

    const statusContainer = container.querySelector('[role="status"]');
    expect(statusContainer).toBeInTheDocument();
    expect(getByText('offlineBanner')).toBeInTheDocument();
  });

  it('renders nothing inside status container when online', () => {
    mockNavigatorOnLine = true;
    const { container, queryByText } = render(<OfflineBanner />);

    const statusContainer = container.querySelector('[role="status"]');
    expect(statusContainer).toBeInTheDocument();
    expect(statusContainer).toBeEmptyDOMElement();
    expect(queryByText('offlineBanner')).not.toBeInTheDocument();
  });
});
