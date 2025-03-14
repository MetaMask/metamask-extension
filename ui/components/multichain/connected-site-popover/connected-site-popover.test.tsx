import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import { ConnectedSitePopover } from './connected-site-popover';

const props = {
  isOpen: true,
  isConnected: true,
  onClick: jest.fn(),
  onClose: jest.fn(),
};

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
    },
    activeTab: {
      id: 113,
      title: 'E2E Test Dapp',
      origin: 'https://metamask.github.io',
      protocol: 'https:',
      url: 'https://metamask.github.io/test-dapp/',
    },
  });
  return renderWithProvider(<ConnectedSitePopover {...props} />, store);
};

describe('ConnectedSitePopover', () => {
  it('renders the popover when isOpen is true', () => {
    const { getByTestId } = render();
    expect(getByTestId('connected-site-popover')).toBeInTheDocument();
  });

  it('displays site name correctly', () => {
    const { getByText } = render();
    expect(getByText('metamask.github.io')).toBeInTheDocument();
  });

  it('triggers onClick when manage permissions button is clicked', () => {
    const { getByText } = render();
    fireEvent.click(getByText('Manage permissions'));
    expect(props.onClick).toHaveBeenCalled();
  });

  it('shows network name when connected', () => {
    const { getByText } = render();
    expect(getByText('Goerli')).toBeInTheDocument();
  });
});
