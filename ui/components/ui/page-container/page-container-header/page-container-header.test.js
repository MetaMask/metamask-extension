import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import PageContainerHeader from '.';

describe('Page Container Header', () => {
  const props = {
    showBackButton: true,
    onBackButtonClick: jest.fn(),
    backButtonStyles: { test: 'style' },
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    tabs: 'Test Tab',
    onClose: jest.fn(),
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <PageContainerHeader {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call back button when click is simulated', () => {
    const { queryByText } = renderWithProvider(
      <PageContainerHeader {...props} />,
    );

    const backButton = queryByText(messages.back.message);

    fireEvent.click(backButton);

    expect(props.onBackButtonClick).toHaveBeenCalled();
  });
});
