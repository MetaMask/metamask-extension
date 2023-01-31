import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import ModalContent from '.';

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
