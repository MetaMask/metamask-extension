import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { useIsMoneyAccountPerpsNavigation } from '../../../hooks/pay/useIsMoneyAccountPerpsNavigation';
import { PerpsToRow } from './perps-to-row';

jest.mock('../../../hooks/pay/useIsMoneyAccountPerpsNavigation', () => ({
  useIsMoneyAccountPerpsNavigation: jest.fn(),
}));

const mockUseIsMoneyAccountPerpsNavigation = jest.mocked(
  useIsMoneyAccountPerpsNavigation,
);

describe('PerpsToRow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseIsMoneyAccountPerpsNavigation.mockReturnValue(false);
  });

  it('renders the To label, infinity icon, and Perps balance text on token-funded Perps deposits', () => {
    renderWithProvider(<PerpsToRow />, configureStore(mockState));

    expect(screen.getByTestId('perps-to-row')).toHaveTextContent(
      messages.to.message,
    );
    expect(screen.getByTestId('perps-to-icon')).toBeInTheDocument();
    expect(screen.getByTestId('perps-to-label')).toHaveTextContent(
      messages.perpsBalance.message,
    );
  });

  it('renders nothing on Money Account-funded Perps deposits', () => {
    mockUseIsMoneyAccountPerpsNavigation.mockReturnValue(true);

    const { container } = renderWithProvider(
      <PerpsToRow />,
      configureStore(mockState),
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('perps-to-row')).not.toBeInTheDocument();
  });
});
