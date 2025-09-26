import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import mockState from '../../../../test/data/mock-state.json';
import { ThemeType } from '../../../../shared/constants/preferences';
import {
  TransactionActivityEmptyState,
  type TransactionActivityEmptyStateProps,
} from './transaction-activity-empty-state';

describe('TransactionActivityEmptyState', () => {
  const middleware = [thunk];

  const renderComponent = (
    props: TransactionActivityEmptyStateProps = {},
    stateOverrides = {},
  ) => {
    const store = configureMockStore(middleware)({
      ...mockState,
      ...stateOverrides,
    });

    return renderWithProvider(
      <TransactionActivityEmptyState {...props} />,
      store,
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByTestId('activity-tab-empty-state')).toBeInTheDocument();
  });

  it('renders description text', () => {
    renderComponent();
    expect(
      screen.getByText(
        'Nothing to see yet. Check the explorer for more recent activity.',
      ),
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderComponent({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders light theme image by default', () => {
    renderComponent();
    const image = screen.getByAltText('Activity');
    expect(image).toHaveAttribute(
      'src',
      './images/empty-state-activity-light.png',
    );
  });

  it('renders dark theme image when dark theme is selected', () => {
    renderComponent(
      {},
      { metamask: { ...mockState.metamask, theme: ThemeType.dark } },
    );
    const image = screen.getByAltText('Activity');
    expect(image).toHaveAttribute(
      'src',
      './images/empty-state-activity-dark.png',
    );
  });
});
