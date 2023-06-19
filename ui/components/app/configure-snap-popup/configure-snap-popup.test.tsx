import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import messages from '../../../../app/_locales/en/messages.json';
import mockState from '../../../../test/data/mock-state.json';
import ConfigureSnapPopup from './configure-snap-popup';

const mockOnClose = jest.fn();
const mockStore = configureMockStore([])(mockState);
describe('ConfigureSnapPopup', () => {
  global.platform = { openTab: jest.fn() };
  it('should take a snapshot', () => {
    const { container } = renderWithProvider(
      <ConfigureSnapPopup onClose={mockOnClose} link={'mockLink'} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('should show popup title and description', async () => {
    const { getByText } = renderWithProvider(
      <ConfigureSnapPopup onClose={mockOnClose} link={'mockLink'} />,
      mockStore,
    );
    expect(
      getByText(messages.configureSnapPopupTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.configureSnapPopupDescription.message),
    ).toBeInTheDocument();
  });

  it('should open link on click of link', async () => {
    const { getByText } = renderWithProvider(
      <ConfigureSnapPopup onClose={mockOnClose} link={'mockLink'} />,
      mockStore,
    );
    const link = getByText('mockLink');
    await fireEvent.click(link);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'mockLink',
    });
  });
});
