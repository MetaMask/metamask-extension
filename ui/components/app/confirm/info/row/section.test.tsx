import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmInfoSection } from './section';

describe('ConfirmInfoSection', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ConfirmInfoSection>Test Content</ConfirmInfoSection>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot without padding', () => {
    const { container } = render(
      <ConfirmInfoSection noPadding>Test Content</ConfirmInfoSection>,
    );
    expect(container).toMatchSnapshot();
  });
});
