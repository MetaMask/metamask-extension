import React from 'react';
import { screen, act } from '@testing-library/react';
import { AvatarTokenSize } from '@metamask/design-system-react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import {
  HYPERLIQUID_ASSET_ICONS_BASE_URL,
  METAMASK_PERPS_ICONS_BASE_URL,
} from '../constants';
import { PerpsTokenLogo } from './perps-token-logo';

const mockStore = configureStore({
  metamask: { ...mockState.metamask },
});

// Plain object the component writes callbacks into directly — avoids setter-only accessor-pairs lint error
let mockImg: { onload?: () => void; onerror?: () => void; src: string } = {
  src: '',
};

beforeEach(() => {
  mockImg = { src: '' };
  jest
    .spyOn(window, 'Image')
    .mockImplementation(() => mockImg as unknown as HTMLImageElement);
});

afterEach(() => jest.restoreAllMocks());

describe('PerpsTokenLogo', () => {
  it('shows skeleton while resolving image URL', () => {
    renderWithProvider(<PerpsTokenLogo symbol="BTC" />, mockStore);

    const el = screen.getByTestId('perps-token-logo-BTC');
    expect(el).toBeInTheDocument();
    expect(el.querySelector('img')).toBeNull();
  });

  it('shows AvatarToken with primary URL once primary loads', () => {
    renderWithProvider(<PerpsTokenLogo symbol="BTC" />, mockStore);

    act(() => {
      mockImg.onload?.();
    });

    const img = screen.getByTestId('perps-token-logo-BTC').querySelector('img');
    expect(img).toHaveAttribute(
      'src',
      `${METAMASK_PERPS_ICONS_BASE_URL}BTC.svg`,
    );
  });

  it('falls back to HyperLiquid URL when primary fails', () => {
    renderWithProvider(<PerpsTokenLogo symbol="BTC" />, mockStore);

    // Primary fails → loads fallback
    act(() => {
      mockImg.onerror?.();
    });
    act(() => {
      mockImg.onload?.();
    });

    const img = screen.getByTestId('perps-token-logo-BTC').querySelector('img');
    expect(img).toHaveAttribute(
      'src',
      `${HYPERLIQUID_ASSET_ICONS_BASE_URL}BTC.svg`,
    );
  });

  it('shows letter fallback when both URLs fail', () => {
    renderWithProvider(<PerpsTokenLogo symbol="xyz:NATGAS" />, mockStore);

    act(() => {
      mockImg.onerror?.();
    }); // primary fails
    act(() => {
      mockImg.onerror?.();
    }); // fallback fails

    const el = screen.getByTestId('perps-token-logo-xyz-NATGAS');
    expect(el.querySelector('img')).toBeNull();
  });

  it('uses hip3 format for MetaMask CDN primary URL on HIP-3 assets', () => {
    renderWithProvider(<PerpsTokenLogo symbol="xyz:TSLA" />, mockStore);

    act(() => {
      mockImg.onload?.();
    });

    const img = screen
      .getByTestId('perps-token-logo-xyz-TSLA')
      .querySelector('img');
    expect(img).toHaveAttribute(
      'src',
      `${METAMASK_PERPS_ICONS_BASE_URL}hip3:xyz_TSLA.svg`,
    );
  });

  it('sanitizes colon to hyphen in test ID for HIP-3 symbols', () => {
    renderWithProvider(<PerpsTokenLogo symbol="xyz:TSLA" />, mockStore);

    expect(screen.getByTestId('perps-token-logo-xyz-TSLA')).toBeInTheDocument();
  });

  it('resets to skeleton when symbol changes', () => {
    const { rerender } = renderWithProvider(
      <PerpsTokenLogo symbol="BTC" />,
      mockStore,
    );

    // Resolve BTC
    act(() => {
      mockImg.onload?.();
    });
    expect(
      screen.getByTestId('perps-token-logo-BTC').querySelector('img'),
    ).toBeInTheDocument();

    rerender(<PerpsTokenLogo symbol="ETH" />);

    // Should be back in skeleton state for ETH
    const ethEl = screen.getByTestId('perps-token-logo-ETH');
    expect(ethEl.querySelector('img')).toBeNull();
  });

  it('applies custom className to skeleton during loading', () => {
    renderWithProvider(
      <PerpsTokenLogo symbol="BTC" className="custom-class" />,
      mockStore,
    );

    expect(screen.getByTestId('perps-token-logo-BTC')).toHaveClass(
      'custom-class',
    );
  });

  it('applies custom className to AvatarToken after resolving', () => {
    renderWithProvider(
      <PerpsTokenLogo symbol="BTC" className="custom-class" />,
      mockStore,
    );

    act(() => {
      mockImg.onload?.();
    });

    expect(screen.getByTestId('perps-token-logo-BTC')).toHaveClass(
      'custom-class',
    );
  });

  it('renders with specified size', () => {
    renderWithProvider(
      <PerpsTokenLogo symbol="SOL" size={AvatarTokenSize.Lg} />,
      mockStore,
    );

    expect(screen.getByTestId('perps-token-logo-SOL')).toBeInTheDocument();
  });
});
