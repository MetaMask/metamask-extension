import React from 'react';
import { it as jestIt } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import WalletOverview from './wallet-overview';
import {
  getBalanceAlignmentClassName,
  getWalletOverviewLayout,
} from './wallet-overview-layout';

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);

const NARROW_SIDEPANEL_CLASS = 'max-[490px]:items-start';

const renderWalletOverview = (className?: string) => {
  render(
    <WalletOverview
      balance={<span data-testid="balance">Balance</span>}
      buttons={<span data-testid="buttons">Buttons</span>}
      className={className}
    />,
  );

  const balanceContainer = screen.getByTestId('balance').parentElement;
  const buttonsContainer = screen.getByTestId('buttons').parentElement;
  const root = balanceContainer?.parentElement;

  if (!root || !balanceContainer || !buttonsContainer) {
    throw new Error('WalletOverview did not render the expected structure');
  }

  return { root, balanceContainer, buttonsContainer };
};

describe('WalletOverview', () => {
  beforeEach(() => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the balance and the buttons', () => {
    renderWalletOverview();

    expect(screen.getByTestId('balance')).toBeInTheDocument();
    expect(screen.getByTestId('buttons')).toBeInTheDocument();
  });

  it('passes className through to the root element', () => {
    const { root } = renderWalletOverview('custom-class');

    expect(root).toHaveClass('custom-class');
  });

  it('renders the balance before the buttons', () => {
    const { root, balanceContainer, buttonsContainer } = renderWalletOverview();

    expect(Array.from(root.children)).toStrictEqual([
      balanceContainer,
      buttonsContainer,
    ]);
  });

  jestIt.each([
    ENVIRONMENT_TYPE_POPUP,
    ENVIRONMENT_TYPE_FULLSCREEN,
    ENVIRONMENT_TYPE_SIDEPANEL,
  ])('applies the shared layout classes in %s', (environmentType) => {
    mockGetEnvironmentType.mockReturnValue(environmentType);

    const { root, balanceContainer, buttonsContainer } = renderWalletOverview();

    expect(root).toHaveClass(
      'flex',
      'min-w-0',
      'w-full',
      'flex-1',
      'flex-col',
      'justify-between',
      'gap-4',
    );
    expect(balanceContainer).toHaveClass(
      'flex',
      'w-full',
      'flex-1',
      'flex-col',
      'gap-1',
    );
    expect(buttonsContainer).toHaveClass(
      'flex',
      'h-full',
      'w-full',
      'max-w-[458px]',
    );
  });

  describe('in the popup', () => {
    it('aligns everything to the start', () => {
      const { root, balanceContainer, buttonsContainer } =
        renderWalletOverview();

      expect(root).toHaveClass('items-start');
      expect(root).not.toHaveClass('items-center');
      expect(balanceContainer).toHaveClass('items-start');
      expect(balanceContainer).not.toHaveClass('items-center');
      expect(balanceContainer).not.toHaveClass(NARROW_SIDEPANEL_CLASS);
      expect(buttonsContainer).not.toHaveClass('self-center');
    });
  });

  describe('in fullscreen', () => {
    beforeEach(() => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    });

    it('centers the content and the buttons', () => {
      const { root, balanceContainer, buttonsContainer } =
        renderWalletOverview();

      expect(root).toHaveClass('items-center');
      expect(root).not.toHaveClass('items-start');
      expect(balanceContainer).toHaveClass('items-center');
      expect(balanceContainer).not.toHaveClass('items-start');
      expect(buttonsContainer).toHaveClass('self-center');
    });

    it('does not apply the narrow side panel alignment', () => {
      const { balanceContainer } = renderWalletOverview();

      expect(balanceContainer).not.toHaveClass(NARROW_SIDEPANEL_CLASS);
    });
  });

  describe('in the side panel', () => {
    beforeEach(() => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    });

    it('centers the content and the buttons', () => {
      const { root, balanceContainer, buttonsContainer } =
        renderWalletOverview();

      expect(root).toHaveClass('items-center');
      expect(root).not.toHaveClass('items-start');
      expect(balanceContainer).toHaveClass('items-center');
      expect(buttonsContainer).toHaveClass('self-center');
    });

    it('aligns the balance to the start when the panel is narrow', () => {
      const { root, balanceContainer, buttonsContainer } =
        renderWalletOverview();

      expect(balanceContainer).toHaveClass(NARROW_SIDEPANEL_CLASS);
      expect(root).not.toHaveClass(NARROW_SIDEPANEL_CLASS);
      expect(buttonsContainer).not.toHaveClass(NARROW_SIDEPANEL_CLASS);
    });
  });
});

describe('wallet-overview-layout', () => {
  describe('getWalletOverviewLayout', () => {
    jestIt.each([
      [ENVIRONMENT_TYPE_POPUP, false, false],
      [ENVIRONMENT_TYPE_FULLSCREEN, true, false],
      [ENVIRONMENT_TYPE_SIDEPANEL, true, true],
    ])(
      'returns the layout flags for %s',
      (environmentType, isFullscreenOrSidepanel, isSidepanel) => {
        mockGetEnvironmentType.mockReturnValue(environmentType);

        expect(getWalletOverviewLayout()).toStrictEqual({
          isFullscreenOrSidepanel,
          isSidepanel,
        });
      },
    );
  });

  describe('getBalanceAlignmentClassName', () => {
    it('returns items-start for the popup', () => {
      expect(
        getBalanceAlignmentClassName({
          isFullscreenOrSidepanel: false,
          isSidepanel: false,
        }),
      ).toBe('items-start');
    });

    it('returns items-center for fullscreen', () => {
      expect(
        getBalanceAlignmentClassName({
          isFullscreenOrSidepanel: true,
          isSidepanel: false,
        }),
      ).toBe('items-center');
    });

    it('returns items-center with a narrow start override for the side panel', () => {
      expect(
        getBalanceAlignmentClassName({
          isFullscreenOrSidepanel: true,
          isSidepanel: true,
        }),
      ).toBe('items-center max-[490px]:items-start');
    });
  });
});
