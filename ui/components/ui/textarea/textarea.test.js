import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import {
  BorderColor,
  BorderStyle,
  Size,
} from '../../../helpers/constants/design-system';
import { RESIZE } from './textarea.constants';
import TextArea from '.';

describe('TextArea', () => {
  const text =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod temporld';
  const onChange = jest.fn();
  let args;
  beforeEach(() => {
    args = {
      name: 'Text area',
      value: text,
      resize: RESIZE.BOTH,
      scrollable: false,
      boxProps: {
        borderColor: BorderColor.borderMuted,
        borderRadius: Size.SM,
        borderStyle: BorderStyle.solid,
        padding: [2, 4],
      },
      height: '100px',
      onChange,
    };
  });
  it('should render the TextArea component without crashing', () => {
    const { getByText } = render(<TextArea {...args} />);
    expect(getByText(text)).toBeDefined();
  });
  it('should call onChange when there is a change made', () => {
    const { container } = render(<TextArea {...args} />);
    fireEvent.change(container.firstChild, { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalled();
  });
  it('should not be able to resize if the resize prop is RESIZE.NONE', () => {
    args.resize = RESIZE.NONE;
    const { container } = render(<TextArea {...args} />);
    const classList = [...container.firstChild.classList];
    const matches = classList.filter((itm) =>
      itm.startsWith('textarea--resize'),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toStrictEqual('textarea--resize-none');
  });
  it('should be able to resize both height and width if the resize prop is RESIZE.BOTH', () => {
    args.resize = RESIZE.BOTH;
    const { container } = render(<TextArea {...args} />);
    const classList = [...container.firstChild.classList];
    const matches = classList.filter((itm) =>
      itm.startsWith('textarea--resize'),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toStrictEqual('textarea--resize-both');
  });
  it('should only be able to resize width if the resize prop is RESIZE.HORIZONTAL', () => {
    args.resize = RESIZE.HORIZONTAL;
    const { container } = render(<TextArea {...args} />);
    const classList = [...container.firstChild.classList];
    const matches = classList.filter((itm) =>
      itm.startsWith('textarea--resize'),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toStrictEqual('textarea--resize-horizontal');
  });
  it('should only be able to resize height if the resize prop is RESIZE.VERTICAL', () => {
    args.resize = RESIZE.VERTICAL;
    const { container } = render(<TextArea {...args} />);
    const classList = [...container.firstChild.classList];
    const matches = classList.filter((itm) =>
      itm.startsWith('textarea--resize'),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toStrictEqual('textarea--resize-vertical');
  });
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
