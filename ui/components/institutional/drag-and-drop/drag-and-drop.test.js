import { render } from '@testing-library/react';
import React from 'react';
import sinon from 'sinon';
import DragAndDrop from './drag-and-drop';

describe('DragAndDrop', () => {
  it('should render the DragAndDrop area', () => {
    const props = {
      handleDrop: sinon.spy(),
      className: 'someClass',
      children: <div>Drop area</div>,
    };

    const { container } = render(<DragAndDrop {...props} />);

    expect(
      container.getElementsByClassName('drag-and-drop__container'),
    ).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
