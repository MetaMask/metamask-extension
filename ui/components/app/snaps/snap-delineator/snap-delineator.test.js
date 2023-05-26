import React from 'react';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import { SnapDelineator } from './snap-delineator';

describe('SnapDelineator', () => {
  const args = {
    snapName: 'Test Snap',
    type: DelineatorType.Content,
    children: 'This is some test content',
  };

  it('should render the SnapDelineator with content inside', () => {
    const { getByText } = renderWithLocalization(<SnapDelineator {...args} />);

    expect(getByText(/Content from Test Snap/u)).toBeDefined();
    expect(getByText(args.children)).toBeDefined();
  });

  it('should render an insight title', () => {
    args.type = DelineatorType.Insights;

    const { getByText } = renderWithLocalization(<SnapDelineator {...args} />);

    expect(getByText(/Insights from Test Snap/u)).toBeDefined();
  });

  it('should render an error title', () => {
    args.type = DelineatorType.Error;

    const { getByText } = renderWithLocalization(<SnapDelineator {...args} />);

    expect(getByText(/Error with Test Snap/u)).toBeDefined();
  });
});
