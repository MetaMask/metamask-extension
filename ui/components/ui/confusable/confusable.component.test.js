import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Confusable from '.';

describe('Confusable component', () => {
  it('should detect zero-width unicode', () => {
    const props = {
      input: 'vitalik.eth',
    };

    const { container } = renderWithProvider(<Confusable {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should detect homoglyphic unicode points', () => {
    const props = {
      input: 'facebook.eth',
    };

    const { container } = renderWithProvider(<Confusable {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should detect multiple homoglyphic unicode points', () => {
    const props = {
      input: 'scope.eth',
    };

    const { container } = renderWithProvider(<Confusable {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('should not detect emoji', () => {
    const props = {
      input: '👻.eth',
    };

    const { container } = renderWithProvider(<Confusable {...props} />);

    expect(container).toMatchSnapshot();
  });
});
