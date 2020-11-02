import assert from 'assert'
import { shallow } from 'enzyme'
import React from 'react'
import Sinon from 'sinon'
import ListItem from '../list-item.component'
import Preloader from '../../icon/preloader/preloader-icon.component'
import Send from '../../icon/send-icon.component'

const TITLE = 'Hello World'
const SUBTITLE = <p>I am a list item</p>
const CLASSNAME = 'list-item-test'
const RIGHT_CONTENT = <p>Content rendered to the right</p>
const CHILDREN = <button>I am a button</button>
const MID_CONTENT = <p>Content rendered in the middle</p>

describe('ListItem', function () {
  let wrapper
  let clickHandler
  before(function () {
    clickHandler = Sinon.fake()
    wrapper = shallow(
      <ListItem
        className={CLASSNAME}
        title={TITLE}
        data-testid="test-id"
        subtitle={SUBTITLE}
        rightContent={RIGHT_CONTENT}
        midContent={MID_CONTENT}
        icon={<Send />}
        titleIcon={<Preloader />}
        onClick={clickHandler}
      >
        {CHILDREN}
      </ListItem>,
    )
  })
  it('includes the data-testid', function () {
    assert.equal(wrapper.props()['data-testid'], 'test-id')
  })
  it(`renders "${TITLE}" title`, function () {
    assert.equal(wrapper.find('.list-item__heading h2').text(), TITLE)
  })
  it(`renders "I am a list item" subtitle`, function () {
    assert.equal(
      wrapper.find('.list-item__subheading').text(),
      'I am a list item',
    )
  })
  it('attaches external className', function () {
    assert(wrapper.props().className.includes(CLASSNAME))
  })
  it('renders content on the right side of the list item', function () {
    assert.equal(
      wrapper.find('.list-item__right-content p').text(),
      'Content rendered to the right',
    )
  })
  it('renders content in the middle of the list item', function () {
    assert.equal(
      wrapper.find('.list-item__mid-content p').text(),
      'Content rendered in the middle',
    )
  })
  it('renders list item actions', function () {
    assert.equal(
      wrapper.find('.list-item__actions button').text(),
      'I am a button',
    )
  })
  it('renders the title icon', function () {
    assert(wrapper.find(Preloader))
  })
  it('renders the list item icon', function () {
    assert(wrapper.find(Send))
  })
  it('handles click action and fires onClick', function () {
    wrapper.simulate('click')
    assert.equal(clickHandler.callCount, 1)
  })

  after(function () {
    Sinon.restore()
  })
})
