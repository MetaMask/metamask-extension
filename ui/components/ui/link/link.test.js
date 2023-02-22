/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import Link from './link';

const METAMASK_URL = 'https://metamask.io/';
describe('Link', () => {
  it('should render link element correctly with id', () => {
    const { container } = render(<Link id="test-link">Link</Link>);
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with href', () => {
    const { container } = render(
      <Link id="test-link" href={METAMASK_URL}>
        Link
      </Link>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with target', () => {
    const { container } = render(
      <Link id="test-link" href={METAMASK_URL} target="_self">
        Link
      </Link>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with res', () => {
    const { container } = render(
      <Link id="test-link" href={METAMASK_URL} rel="license">
        Link
      </Link>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with referer', () => {
    const { container } = render(
      <Link id="test-link" href={METAMASK_URL} rel="license" referer>
        Link
      </Link>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render link element correctly target rel referer', () => {
    const { container } = render(
      <Link
        id="test-link"
        href={METAMASK_URL}
        rel="nofollow"
        target="self"
        referer
      >
        Link
      </Link>,
    );
    expect(container).toMatchSnapshot();
  });
});
