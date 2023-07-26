import * as React from 'react';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import SnapVersion from './snap-version';

describe('SnapVersion', () => {
  const args = {
    version: '1.4.2',
    url: 'https://www.npmjs.com/package/@metamask/test-snap-error',
  };

  it('should render the SnapVersion without crashing and display a version', () => {
    const { getByText, container } = renderWithLocalization(
      <SnapVersion {...args} />,
    );
    expect(getByText(args.version)).toBeDefined();
    expect(container.firstChild).toHaveAttribute('href', args.url);
  });

  it('should have a loading state if no version is passed', () => {
    args.version = undefined;

    const { container } = renderWithLocalization(<SnapVersion {...args} />);

    expect(container.getElementsByClassName('preloader__icon')).toHaveLength(1);
    expect(container.firstChild).toHaveAttribute('href', args.url);
  });
});
