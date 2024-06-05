import * as React from 'react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import SnapExternalPill from './snap-external-pill';

describe('SnapExternalPill', () => {
  const args = {
    value: '1.4.2',
    url: 'https://www.npmjs.com/package/@metamask/test-snap-error',
  };

  it('should render the content without crashing and display it', () => {
    const { getByText, container } = renderWithLocalization(
      <SnapExternalPill {...args} />,
    );
    expect(getByText(args.value)).toBeDefined();
    expect(container.firstChild).toHaveAttribute('href', args.url);
  });

  it('should have a loading state if no value is passed', () => {
    args.value = undefined;

    const { container } = renderWithLocalization(
      <SnapExternalPill {...args} />,
    );

    expect(container.getElementsByClassName('preloader__icon')).toHaveLength(1);
    expect(container.firstChild).toHaveAttribute('href', args.url);
  });
});
