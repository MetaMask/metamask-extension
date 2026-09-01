import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { SettingsTab } from './settings-tab';

describe('SettingsTab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  it('renders all items passed', () => {
    const MockItem1 = () => <div data-testid="mock-item-1">Item 1</div>;
    const MockItem2 = () => <div data-testid="mock-item-2">Item 2</div>;
    const MockItem3 = () => <div data-testid="mock-item-3">Item 3</div>;

    const mockItems = [
      { id: 'item-1', component: MockItem1 },
      { id: 'item-2', component: MockItem2 },
      { id: 'item-3', component: MockItem3 },
    ];

    renderWithProvider(<SettingsTab items={mockItems} />, mockStore);

    expect(screen.getByTestId('mock-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('mock-item-3')).toBeInTheDocument();
  });

  it('renders items in the correct order', () => {
    const MockItemA = () => <div>First</div>;
    const MockItemB = () => <div>Second</div>;

    const mockItems = [
      { id: 'a', component: MockItemA },
      { id: 'b', component: MockItemB },
    ];

    const { container } = renderWithProvider(
      <SettingsTab items={mockItems} />,
      mockStore,
    );

    const { textContent } = container;
    expect(textContent?.indexOf('First')).toBeLessThan(
      textContent?.indexOf('Second') ?? -1,
    );
  });

  it('renders dividers when hasDividerBefore is true', () => {
    const MockItem1 = () => <div data-testid="mock-item-1">Item 1</div>;
    const MockItem2 = () => <div data-testid="mock-item-2">Item 2</div>;

    const mockItems = [
      { id: 'item-1', component: MockItem1 },
      { id: 'item-2', component: MockItem2, hasDividerBefore: true },
    ];

    const { container } = renderWithProvider(
      <SettingsTab items={mockItems} />,
      mockStore,
    );

    const dividers = container.querySelectorAll('.h-px');
    expect(dividers).toHaveLength(1);
  });

  it('does not render dividers when hasDividerBefore is false or undefined', () => {
    const MockItem1 = () => <div data-testid="mock-item-1">Item 1</div>;
    const MockItem2 = () => <div data-testid="mock-item-2">Item 2</div>;

    const mockItems = [
      { id: 'item-1', component: MockItem1 },
      { id: 'item-2', component: MockItem2, hasDividerBefore: false },
    ];

    const { container } = renderWithProvider(
      <SettingsTab items={mockItems} />,
      mockStore,
    );

    const dividers = container.querySelectorAll('.h-px');
    expect(dividers).toHaveLength(0);
  });
});
