import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import MetaFoxLogo from '.';

jest.mock(
  './horizontal-logo.js',
  () =>
    function mockRender() {
      return <div></div>;
    },
);

describe('MetaFoxLogo', () => {
  it('should match snapshot with img width and height default set to 42', () => {
    const { container } = renderWithProvider(<MetaFoxLogo />);

    expect(container).toMatchSnapshot();
  });

  it('does not set icon height and width when unsetIconHeight is true', () => {
    const { container } = renderWithProvider(<MetaFoxLogo unsetIconHeight />);

    expect(container).toMatchSnapshot();
  });
});
