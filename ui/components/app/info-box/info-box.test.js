import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

import InfoBox from './info-box.component';

describe('InfoBox', () => {
  const props = {
    title: 'Title',
    description: 'Description',
    onClose: jest.fn(),
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<InfoBox {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('should call handleClose on info close element', () => {
    const { queryByTestId } = renderWithProvider(<InfoBox {...props} />);
    const infoBoxClose = queryByTestId('info-box-close');

    fireEvent.click(infoBoxClose);
    expect(props.onClose).toHaveBeenCalled();
  });
});
