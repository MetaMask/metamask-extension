const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const MenuDroppo = require('./menu-droppo')
const extend = require('xtend')

const noop = () => {}

class Dropdown extends Component {
  render () {
    const { isOpen, onClickOutside, style, innerStyle, children, useCssTransition, constOverflow } = this.props

    const innerStyleDefaults = extend({
      padding: '15px 30px',
      background: 'transparent',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    }, innerStyle)

    const styleDefaults = extend({
      borderRadius: '4px',
      background: 'rgba(71, 28, 115, 0.95)',
      overflowY: 'auto',
      transition: 'max-height 300ms ease-in-out',
    }, style)

    return h(
      MenuDroppo,
      {
        useCssTransition,
        isOpen,
        zIndex: 11,
        constOverflow,
        onClickOutside,
        style: styleDefaults,
        innerStyle: innerStyleDefaults,
      },
      [
        h(
          'style',
          `
          li.dropdown-menu-item:hover { color:#ffffff; }
          li.dropdown-menu-item { color: rgba(255, 255, 255, 0.5); position: relative }
          `
        ),
        ...children,
      ]
    )
  }
}

Dropdown.defaultProps = {
  isOpen: false,
  onClick: noop,
  useCssTransition: false,
}

Dropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  style: PropTypes.object.isRequired,
  onClickOutside: PropTypes.func,
  innerStyle: PropTypes.object,
  useCssTransition: PropTypes.bool,
  constOverflow: PropTypes.bool,
}

class DropdownMenuItem extends Component {
  render () {
    const { onClick, closeMenu, children, style } = this.props

    return h(
      'li.dropdown-menu-item',
      {
        onClick: () => {
          onClick()
          closeMenu()
        },
        style: Object.assign({
          listStyle: 'none',
          padding: (style && style.padding) ? style.padding : '15px 0px',
          fontSize: '16px',
          fontStyle: 'normal',
          fontFamily: 'Nunito Regular',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }, style),
      },
      children
    )
  }
}

DropdownMenuItem.propTypes = {
  closeMenu: PropTypes.func,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
}

module.exports = {
  Dropdown,
  DropdownMenuItem,
}
