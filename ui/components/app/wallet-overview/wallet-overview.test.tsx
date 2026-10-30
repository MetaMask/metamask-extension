import React from 'react';
import { it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { useFullScreenDesign } from '../../../hooks/useFullScreenDesign';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import WalletOverview from './wallet-overview';

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../hooks/useFullScreenDesign');

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockUseFullScreenDesign = jest.mocked(useFullScreenDesign);

const renderWalletOverview = (className?: string) => {
  const { container } = render(
    <WalletOverview
      balance={<span data-testid="balance" />}
      buttons={<span data-testid="buttons" />}
      className={className}
    />,
  );

  return {
    root: container.firstElementChild,
    balanceContainer: screen.getByTestId('balance').parentElement,
  };
};

describe('WalletOverview', () => {
  beforeEach(() => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    mockUseFullScreenDesign.mockReturnValue(false);
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

  it.each([
    [ENVIRONMENT_TYPE_POPUP, 'items-start'],
    [ENVIRONMENT_TYPE_FULLSCREEN, 'items-center'],
    [ENVIRONMENT_TYPE_SIDEPANEL, 'items-center'],
  ])('aligns the root in %s with %s', (environmentType, alignment) => {
    mockGetEnvironmentType.mockReturnValue(environmentType);

    const { root } = renderWalletOverview();

    expect(root).toHaveClass(alignment);
  });

  it.each([
    [ENVIRONMENT_TYPE_POPUP, false],
    [ENVIRONMENT_TYPE_FULLSCREEN, false],
    [ENVIRONMENT_TYPE_SIDEPANEL, true],
  ])(
    'applies the narrow width left-align fallback in %s: %s',
    (environmentType, hasFallback) => {
      mockGetEnvironmentType.mockReturnValue(environmentType);

      const { balanceContainer } = renderWalletOverview();

      if (hasFallback) {
        expect(balanceContainer).toHaveClass('max-[490px]:items-start');
      } else {
        expect(balanceContainer).not.toHaveClass('max-[490px]:items-start');
      }
    },
  );

  it('left-aligns the content and removes max-width on the buttons in the fullscreen design', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    mockUseFullScreenDesign.mockReturnValue(true);

    const { root, balanceContainer } = renderWalletOverview();

    expect(root).toHaveClass('items-start');
    expect(balanceContainer).toHaveClass('items-start');
    expect(screen.getByTestId('buttons').parentElement).not.toHaveClass(
      'max-w-[458px]',
      'self-center',
    );
  });
});
