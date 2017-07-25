var assert = require('assert');

const additions = require('react-testutils-additions');
const h = require('react-hyperscript');
const ReactTestUtils = require('react-addons-test-utils');
const sinon = require('sinon');
const path = require('path');
const Dropdown = require(path.join(__dirname, '..', '..', '..', '..', 'ui', 'app', 'components', 'dropdown.js')).Dropdown;
const DropdownMenuItem = require(path.join(__dirname, '..', '..', '..', '..', 'ui', 'app', 'components', 'dropdown.js')).DropdownMenuItem;

describe('Dropdown components', function () {
  let onClickOutside;
  let closeMenu;
  let onClick;

  let dropdownComponentProps;
  const renderer = ReactTestUtils.createRenderer()
  beforeEach(function () {
    onClickOutside = sinon.spy();
    closeMenu = sinon.spy();
    onClick = sinon.spy();

    dropdownComponentProps = {
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
  });

  it('can render two items', function () {
    const dropdownComponent = h(
      Dropdown,
      dropdownComponentProps,
      [
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
      ]
    )

    const component = additions.renderIntoDocument(dropdownComponent);
    renderer.render(dropdownComponent);
    const items = additions.find(component, 'li');
    assert.equal(items.length, 2);
  });

  it('closes when item clicked', function() {
    const dropdownComponent = h(
      Dropdown,
      dropdownComponentProps,
      [
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
      ]
    )
    const component = additions.renderIntoDocument(dropdownComponent);
    renderer.render(dropdownComponent);
    const items = additions.find(component, 'li');
    const node = items[0];
    ReactTestUtils.Simulate.click(node);
    assert.equal(closeMenu.calledOnce, true);
  });

  it('invokes click handler when item clicked', function() {
    const dropdownComponent = h(
      Dropdown,
      dropdownComponentProps,
      [
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
      ]
    )
    const component = additions.renderIntoDocument(dropdownComponent);
    renderer.render(dropdownComponent);
    const items = additions.find(component, 'li');
    const node = items[0];
    ReactTestUtils.Simulate.click(node);
    assert.equal(onClick.calledOnce, true);
  });
});
