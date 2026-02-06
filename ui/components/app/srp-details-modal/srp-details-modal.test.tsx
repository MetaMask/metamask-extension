import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import SRPDetailsModal from './srp-details-modal';

describe('SRP Details Modal', () => {
  const onCloseStub = jest.fn();

  it('should render', () => {
    const { getByText } = renderWithProvider(
      <SRPDetailsModal onClose={onCloseStub} />,
    );

    const title = getByText(messages.srpDetailsTitle.message);
    expect(title).toBeInTheDocument();

    const gotItButton = getByText(messages.gotIt.message);
    expect(gotItButton).toBeInTheDocument();
  });

  it('onClose function is called when the button is clicked', () => {
    const { getByText } = renderWithProvider(
      <SRPDetailsModal onClose={onCloseStub} />,
    );

    const gotItButton = getByText(messages.gotIt.message);
    fireEvent.click(gotItButton);
    expect(onCloseStub).toHaveBeenCalled();
  });
});
