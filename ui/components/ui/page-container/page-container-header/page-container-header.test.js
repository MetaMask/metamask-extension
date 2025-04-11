import { fireEvent } from '@testing-library/react';
import React from 'react';

import PageContainerHeader from '.';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

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

    const backButton = queryByText('Back');

    fireEvent.click(backButton);

    expect(props.onBackButtonClick).toHaveBeenCalled();
  });
});
