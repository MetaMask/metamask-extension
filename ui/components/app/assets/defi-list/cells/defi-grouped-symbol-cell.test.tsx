import React from 'react';
import { render } from '@testing-library/react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { DeFiSymbolGroup } from './defi-grouped-symbol-cell';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

describe('DeFiSymbolGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with one symbol', () => {
    (useI18nContext as jest.Mock).mockReturnValue((key: string) =>
      key === 'only' ? 'only' : '',
    );
    const { getByTestId } = render(
      <DeFiSymbolGroup symbols={['ETH']} privacyMode={false} />,
    );

    const element = getByTestId('defi-list-symbol-group');
    expect(element).toHaveTextContent('ETH only');
  });

  it('renders correctly with two symbols', () => {
    (useI18nContext as jest.Mock).mockReturnValue((key: string) =>
      key === 'other' ? 'other' : '',
    );
    const { getByTestId } = render(
      <DeFiSymbolGroup symbols={['ETH', 'BTC']} privacyMode={false} />,
    );

    const element = getByTestId('defi-list-symbol-group');
    expect(element).toHaveTextContent('ETH +1 other');
  });

  it('renders correctly with more than two symbols', () => {
    (useI18nContext as jest.Mock).mockReturnValue((key: string) =>
      key === 'others' ? 'others' : '',
    );
    const { getByTestId } = render(
      <DeFiSymbolGroup symbols={['ETH', 'BTC', 'DAI']} privacyMode={false} />,
    );

    const element = getByTestId('defi-list-symbol-group');
    expect(element).toHaveTextContent('ETH +2 others');
  });

  it('hides text when privacyMode is enabled', () => {
    (useI18nContext as jest.Mock).mockReturnValue(() => '');
    const { getByTestId } = render(
      <DeFiSymbolGroup symbols={['ETH']} privacyMode={true} />,
    );

    const element = getByTestId('defi-list-symbol-group');
    expect(element).toHaveTextContent('•••••••••');
  });
});
