import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Preloader from '../icon/preloader/preloader-icon.component';
import Send from '../icon/send-icon.component';
import ListItem from './list-item.component';

const TITLE = 'Hello World';
const SUBTITLE = <p>I am a list item</p>;
const CLASSNAME = 'list-item-test';
const RIGHT_CONTENT = <p>Content rendered to the right</p>;
const CHILDREN = <button>I am a button</button>;
const MID_CONTENT = <p>Content rendered in the middle</p>;

describe('ListItem', () => {
  const props = {
    className: CLASSNAME,
    title: TITLE,
    'data-testid': 'test-id',
    subtitle: SUBTITLE,
    rightContent: RIGHT_CONTENT,
    midContent: MID_CONTENT,
    icon: <Send size={28} color="2F80ED" />,
    titleIcon: <Preloader size={28} />,
    onClick: jest.fn(),
  };

  it('should match snapshot with no props', () => {
    const { container } = renderWithProvider(<ListItem />);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with props', () => {
    const { container } = renderWithProvider(
      <ListItem {...props}>{CHILDREN}</ListItem>,
    );

    expect(container).toMatchSnapshot();
  });

  it('handles click action and fires onClick', () => {
    const { queryByTestId } = renderWithProvider(
      <ListItem {...props}>{CHILDREN}</ListItem>,
    );

    fireEvent.click(queryByTestId('test-id'));

    expect(props.onClick).toHaveBeenCalled();
  });
});
