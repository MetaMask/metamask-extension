import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Icon, IconName, IconSize } from '../../component-library';
import { ActivityListItem } from './activity-list-item';

const TITLE = 'Hello World';
const SUBTITLE = <p>I am a list item</p>;
const CLASSNAME = 'list-item-test';
const RIGHT_CONTENT = <p>Content rendered to the right</p>;
const CHILDREN = <button>I am a button</button>;
const MID_CONTENT = <p>Content rendered in the middle</p>;
const TOP_CONTENT = <p>Content rendered at the top</p>;

describe('ActivityListItem', () => {
  const defaultProps = {
    className: CLASSNAME,
    title: TITLE,
    'data-testid': 'test-id',
    subtitle: SUBTITLE,
    rightContent: RIGHT_CONTENT,
    midContent: MID_CONTENT,
    topContent: TOP_CONTENT,
    icon: <Icon name={IconName.Custody} size={IconSize.Xs} />,
    onClick: jest.fn(),
  };

  it('should match snapshot with no props', () => {
    const { container } = render(<ActivityListItem />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with props', () => {
    const { container } = render(
      <ActivityListItem {...defaultProps}>{CHILDREN}</ActivityListItem>,
    );

    expect(container).toMatchSnapshot();
  });

  it('calls onClick when clicked', () => {
    const { getByTestId } = render(<ActivityListItem {...defaultProps} />);
    fireEvent.click(getByTestId('test-id'));
    expect(defaultProps.onClick).toHaveBeenCalled();
  });
});
