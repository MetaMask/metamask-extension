import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';
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
  let wrapper;
  let clickHandler;
  beforeAll(() => {
    clickHandler = sinon.fake();
    wrapper = shallow(
      <ListItem
        className={CLASSNAME}
        title={TITLE}
        data-testid="test-id"
        subtitle={SUBTITLE}
        rightContent={RIGHT_CONTENT}
        midContent={MID_CONTENT}
        icon={<Send size={28} color="2F80ED" />}
        titleIcon={<Preloader size={28} />}
        onClick={clickHandler}
      >
        {CHILDREN}
      </ListItem>,
    );
  });

  afterAll(() => {
    sinon.restore();
  });

  it('includes the data-testid', () => {
    expect(wrapper.props()['data-testid']).toStrictEqual('test-id');
  });
  it(`renders "${TITLE}" title`, () => {
    expect(wrapper.find('.list-item__heading h2').text()).toStrictEqual(TITLE);
  });
  it(`renders "I am a list item" subtitle`, () => {
    expect(wrapper.find('.list-item__subheading').text()).toStrictEqual(
      'I am a list item',
    );
  });
  it('attaches external className', () => {
    expect(wrapper.props().className).toContain(CLASSNAME);
  });
  it('renders content on the right side of the list item', () => {
    expect(wrapper.find('.list-item__right-content p').text()).toStrictEqual(
      'Content rendered to the right',
    );
  });
  it('renders content in the middle of the list item', () => {
    expect(wrapper.find('.list-item__mid-content p').text()).toStrictEqual(
      'Content rendered in the middle',
    );
  });
  it('renders list item actions', () => {
    expect(wrapper.find('.list-item__actions button').text()).toStrictEqual(
      'I am a button',
    );
  });
  it('renders the title icon', () => {
    expect(wrapper.find(Preloader)).toHaveLength(1);
  });
  it('renders the list item icon', () => {
    expect(wrapper.find(Send)).toHaveLength(1);
  });
  it('handles click action and fires onClick', () => {
    wrapper.simulate('click');
    expect(clickHandler.callCount).toStrictEqual(1);
  });
});
