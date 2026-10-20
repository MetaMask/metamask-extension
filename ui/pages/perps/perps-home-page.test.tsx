import React from 'react';
import { render, screen } from '@testing-library/react';
import { useABTest } from '../../hooks/useABTest';
import { PERPS_HOME_TAB_ROUTE } from '../../hooks/perps/usePerpsHomeRoute';
import { PerpsHomePage } from './perps-home-page';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
    <div data-testid="navigate" data-to={to} data-replace={String(replace)} />
  ),
}));

jest.mock('../../hooks/useABTest');

jest.mock('../../components/app/perps/perps-tab', () => ({
  PerpsTab: () => <div data-testid="perps-tab">PerpsTab</div>,
}));

const mockUseABTest = jest.mocked(useABTest);

describe('PerpsHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders PerpsTab when bottom nav bar is enabled (treatment)', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: true },
      variantName: 'treatment',
      isActive: true,
    });

    render(<PerpsHomePage />);

    expect(screen.getByTestId('perps-home-page')).toBeInTheDocument();
    expect(screen.getByTestId('perps-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('renders PerpsTab while the bottom-nav assignment is unresolved', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: false },
      variantName: 'control',
      isActive: false,
    });

    render(<PerpsHomePage />);

    expect(screen.getByTestId('perps-home-page')).toBeInTheDocument();
    expect(screen.getByTestId('perps-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirects to /?tab=perps when bottom nav bar is disabled (control)', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: false },
      variantName: 'control',
      isActive: true,
    });

    render(<PerpsHomePage />);

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-to', PERPS_HOME_TAB_ROUTE);
    expect(navigate).toHaveAttribute('data-replace', 'true');
    expect(screen.queryByTestId('perps-home-page')).not.toBeInTheDocument();
  });

  it('calls useABTest with trackExposure: false', () => {
    mockUseABTest.mockReturnValue({
      variant: { withBottomNavBar: true },
      variantName: 'treatment',
      isActive: true,
    });

    render(<PerpsHomePage />);

    expect(mockUseABTest).toHaveBeenCalledWith(
      'coreExtensionUxCeux1141AbtestBottomNav',
      expect.any(Object),
      expect.any(Object),
      { trackExposure: false },
    );
  });
});
