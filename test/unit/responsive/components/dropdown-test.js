const assert = require('assert');

const h = require('react-hyperscript');
const sinon = require('sinon');
const path = require('path');
const Dropdown = require(path.join(__dirname, '..', '..', '..', '..', 'ui', 'app', 'components', 'dropdowns', 'index.js')).Dropdown;

const { createMockStore } = require('redux-test-utils')
const shallowWithStore = require('../../../lib/shallow-with-store')

const mockState = {
  metamask: {
  }
}

describe('Dropdown components', function () {
  let onClickOutside;
  let closeMenu;
  let onClick;

  let dropdownComponentProps = {
    isOpen: true,
    zIndex: 11,
    onClickOutside,
    style: {
      position: 'absolute',
      right: 0,
      top: '36px',
    },
    innerStyle: {},
  }

  let dropdownComponent
  let store
  let component
  beforeEach(function () {
    onClickOutside = sinon.spy();
    closeMenu = sinon.spy();
    onClick = sinon.spy();

    store = createMockStore(mockState)
    component = shallowWithStore(h(
      Dropdown,
      dropdownComponentProps,
      [
        h('style', `
          .drop-menu-item:hover { background:rgb(235, 235, 235); }
          .drop-menu-item i { margin: 11px; }
        `),
        h('li', {
          closeMenu,
          onClick,
        }, 'Item 1'),
        h('li', {
          closeMenu,
          onClick,
        }, 'Item 2'),
      ]
    ), store)
    dropdownComponent = component.dive()
  })

  it('can render two items', function () {
    const items = dropdownComponent.find('li');
    assert.equal(items.length, 2);
  });

  it('closes when item clicked', function() {
    const items = dropdownComponent.find('li');
    const node = items.at(0);
    node.simulate('click');
    assert.equal(node.props().closeMenu, closeMenu);
  });

  it('invokes click handler when item clicked', function() {
    const items = dropdownComponent.find('li');
    const node = items.at(0);
    node.simulate('click');
    assert.equal(onClick.calledOnce, true);
  });
});
