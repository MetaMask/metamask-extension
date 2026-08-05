import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { SettingsSelectItem } from './settings-select-item';

const mockStore = configureMockStore([thunk])(mockState);

describe('SettingsSelectItem', () => {
  it('renders the label, value and a link to the route', () => {
    renderWithProvider(
      <SettingsSelectItem label="My label" value="My value" to="/test-route" />,
      mockStore,
    );

    expect(screen.getByText('My label')).toBeInTheDocument();
    expect(screen.getByText('My value')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test-route');
  });

  it('forwards the dataTestId to the clickable link', () => {
    renderWithProvider(
      <SettingsSelectItem
        label="My label"
        value="My value"
        to="/test-route"
        dataTestId="my-select-item"
      />,
      mockStore,
    );

    expect(screen.getByTestId('my-select-item')).toBeInTheDocument();
  });

  it('renders the leading accessory when provided', () => {
    renderWithProvider(
      <SettingsSelectItem
        label="My label"
        value="My value"
        to="/test-route"
        startAccessory={<span data-testid="leading-icon">icon</span>}
      />,
      mockStore,
    );

    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    expect(screen.getByText('My label')).toBeInTheDocument();
  });

  it('does not render a leading accessory when omitted', () => {
    renderWithProvider(
      <SettingsSelectItem label="My label" value="My value" to="/test-route" />,
      mockStore,
    );

    expect(screen.queryByTestId('leading-icon')).not.toBeInTheDocument();
  });
});
