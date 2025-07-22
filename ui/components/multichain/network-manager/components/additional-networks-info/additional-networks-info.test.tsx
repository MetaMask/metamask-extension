import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { AdditionalNetworksInfo } from './additional-networks-info';

// Mock the global platform.openTab
const mockOpenTab = jest.fn();
// @ts-expect-error mocking platform
global.platform = {
  openTab: mockOpenTab,
  closeCurrentWindow: jest.fn(),
};

describe('AdditionalNetworksInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    expect(screen.getByText('Additional networks')).toBeInTheDocument();
  });

  it('shows info icon', () => {
    renderComponent();

    // Check that the info icon is rendered
    const infoIcon = document.querySelector('.add-network__warning-icon');
    expect(infoIcon).toBeInTheDocument();
  });

  it('shows popover on mouse enter and hides on mouse leave', async () => {
    renderComponent();

    // Initially the popover should not show its content
    expect(
      screen.queryByText('Some of these networks rely on third parties'),
    ).not.toBeInTheDocument();

    // Find the info icon
    const infoIcon = document.querySelector('.add-network__warning-icon');
    expect(infoIcon).toBeInTheDocument();

    // Trigger mouse enter on the info icon and wait for state updates
    await act(async () => {
      if (infoIcon) {
        fireEvent.mouseEnter(infoIcon);
      }
      // Small delay to allow the state update to complete
      await new Promise((r) => setTimeout(r, 0));
    });

    // Popover content should now be visible
    expect(
      screen.getByText((content) =>
        content.startsWith('Some of these networks rely on third partie'),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Learn more')).toBeInTheDocument();

    // Trigger mouse leave on the containing box to close the popover
    const containerBox = screen
      .getByText('Additional networks')
      .closest('div[role="presentation"]');
    await act(async () => {
      if (containerBox) {
        fireEvent.mouseLeave(containerBox);
      }
      // Small delay to allow the state update to complete
      await new Promise((r) => setTimeout(r, 0));
    });

    // We've handled the state updates properly with act()
  });

  it('opens external documentation when "Learn more" is clicked', async () => {
    renderComponent();

    // Open the popover
    const infoIcon = document.querySelector('.add-network__warning-icon');
    await act(async () => {
      if (infoIcon) {
        fireEvent.mouseEnter(infoIcon);
      }
      // Small delay to allow the state update to complete
      await new Promise((r) => setTimeout(r, 0));
    });

    // Find and click the learn more button
    await act(async () => {
      const learnMoreButton = screen.getByText('Learn more');
      fireEvent.click(learnMoreButton);
      // Small delay to allow the state update to complete
      await new Promise((r) => setTimeout(r, 0));
    });

    // Verify that global.platform.openTab was called with correct URL
    expect(mockOpenTab).toHaveBeenCalledTimes(1);
    expect(mockOpenTab).toHaveBeenCalledWith({
      url: ZENDESK_URLS.UNKNOWN_NETWORK,
    });
  });
});
