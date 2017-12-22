const Component = require('react').Component
const PropTypes = require('react').PropTypes
const h = require('react-hyperscript')
const MenuDroppo = require('../../menu-droppo')
const extend = require('xtend')

const noop = () => {}

class Dropdown extends Component {
  render () {
    const {
      containerClassName,
      isOpen,
      onClickOutside,
      style,
      innerStyle,
      children,
      useCssTransition,
    } = this.props

    const innerStyleDefaults = extend({
      borderRadius: '4px',
      padding: '8px 16px',
      background: 'rgba(0, 0, 0, 0.8)',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    }, innerStyle)

    return h(
      MenuDroppo,
      {
        containerClassName,
        useCssTransition,
        isOpen,
        zIndex: 55,
        onClickOutside,
        style,
        innerStyle: innerStyleDefaults,
      },
      [
        h(
          'style',
          `
          li.dropdown-menu-item:hover {
            color:rgb(225, 225, 225);
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          li.dropdown-menu-item { color: rgb(185, 185, 185); }
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
  containerClassName: PropTypes.string,
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
          padding: '8px 0px',
          fontSize: '18px',
          fontStyle: 'normal',
          fontFamily: 'Montserrat Regular',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: 'white',
        }, style),
      },
      children
    )
  }
}

DropdownMenuItem.propTypes = {
  closeMenu: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
}

module.exports = {
  Dropdown,
  DropdownMenuItem,
}
