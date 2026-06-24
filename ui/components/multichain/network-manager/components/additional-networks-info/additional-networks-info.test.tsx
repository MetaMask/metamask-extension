import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import { AdditionalNetworksInfo } from './additional-networks-info';

describe('AdditionalNetworksInfo', () => {
  const renderComponent = () => {
    const store = configureStore({});
    return renderWithProvider(<AdditionalNetworksInfo />, store);
  };

  it('renders correctly', () => {
    const { container } = renderComponent();
    expect(container).toMatchSnapshot();
  });

  it('renders the component with "Additional networks" text', () => {
    renderComponent();
    // Using the actual text that's rendered with the real i18n context
    expect(
      screen.getByText(messages.additionalNetworks.message),
    ).toBeInTheDocument();
  });

  it('does not render the info icon', () => {
    renderComponent();
    expect(
      document.querySelector('.add-network__warning-icon'),
    ).not.toBeInTheDocument();
  });
});
