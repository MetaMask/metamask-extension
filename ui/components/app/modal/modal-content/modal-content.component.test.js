import React from 'react';

import ModalContent from '.';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';

describe('ModalContent Component', () => {
  const props = {
    title: 'Modal Title',
    description: 'Modal Description',
  };
  it('should match snapshot', () => {
    const { container } = renderWithProvider(<ModalContent {...props} />);

    expect(container).toMatchSnapshot();
  });
});
