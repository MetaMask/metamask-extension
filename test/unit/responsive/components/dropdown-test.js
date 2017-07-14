var assert = require('assert');

const additions = require('react-testutils-additions');
const h = require('react-hyperscript');
const ReactTestUtils = require('react-addons-test-utils');
const sinon = require('sinon');
const path = require('path');
const Dropdown = require(path.join(__dirname, '..', '..', '..', '..', 'ui', 'responsive', 'app', 'components', 'dropdown.js')).Dropdown;
const DropdownMenuItem = require(path.join(__dirname, '..', '..', '..', '..', 'ui', 'responsive', 'app', 'components', 'dropdown.js')).DropdownMenuItem;

describe('Dropdown components', function () {
  it('can render two items', function () {
    const renderer = ReactTestUtils.createRenderer()

    const onClickOutside = sinon.spy();
    const closeMenu = sinon.spy();
    const onClick = sinon.spy();

    const dropdownComponent = h(Dropdown, {
      isOpen: true,
      zIndex: 11,
      onClickOutside,
      style: {
        position: 'absolute',
        right: 0,
        top: '36px',
      },
      innerStyle: {},
    }, [ // DROP MENU ITEMS
      h('style', `
        .drop-menu-item:hover { background:rgb(235, 235, 235); }
        .drop-menu-item i { margin: 11px; }
      `),

      h(DropdownMenuItem, {
        closeMenu,
        onClick,
      }, 'Item 1'),

      h(DropdownMenuItem, {
        closeMenu,
        onClick,
      }, 'Item 2'),
    ])

    const component = additions.renderIntoDocument(dropdownComponent);
    renderer.render(dropdownComponent);
    const items = additions.find(component, 'li');
    assert.equal(items.length, 2);
  });
});