import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import {
  COLORS,
  RESIZE,
  SIZES,
  BORDER_STYLE,
} from '../../../helpers/constants/design-system';
import TextArea from '.';

describe('TextArea', () => {
  const text =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld';
  const onChange = jest.fn();
  const args = {
    name: 'Text area',
    value: text,
    resize: RESIZE.BOTH,
    scrollable: false,
    boxProps: {
      borderColor: COLORS.UI3,
      borderRadius: SIZES.SM,
      borderStyle: BORDER_STYLE.SOLID,
      padding: [2, 4],
    },
    height: '100px',
    onChange,
  };
  it('should render the TextArea component without crashing', () => {
    const { getByText } = render(<TextArea {...args} />);
    expect(getByText(text)).toBeDefined();
  });
  it('should call onChange when there is a change made', () => {
    const { container } = render(<TextArea {...args} />);
    fireEvent.change(container.firstChild, { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalled();
  });
  // it('should not be able resize if resize prop is RESIZE.NONE', () => {
  //
  // });
  // it('should be able to resize both height and width if resize prop is RESIZE.BOTH', () => {
  //
  // });
  // it('should be able to resize only width if resize prop is RESIZE.HORIZONTAL', () => {
  //
  // });
  // it('should be able to resize only height if resize prop is RESIZE.VERTICAL', () => {
  //
  // });
  it('should be able to scroll when given a true value for scrollable', () => {
    args.scrollable = true;
    const { container } = render(<TextArea {...args} />);
    const doesScroll = container.firstChild.classList.contains(
      'textarea--scrollable',
    );
    const doesNotScroll = container.firstChild.classList.contains(
      'textarea--not-scrollable',
    );
    expect(doesScroll).toStrictEqual(true);
    expect(doesNotScroll).toStrictEqual(false);
  });

  it('should NOT be able to scroll when given a false value for scrollable', () => {
    args.scrollable = false;
    const { container } = render(<TextArea {...args} />);
    const doesScroll = container.firstChild.classList.contains(
      'textarea--scrollable',
    );
    const doesNotScroll = container.firstChild.classList.contains(
      'textarea--not-scrollable',
    );
    expect(doesScroll).toStrictEqual(false);
    expect(doesNotScroll).toStrictEqual(true);
  });
});
