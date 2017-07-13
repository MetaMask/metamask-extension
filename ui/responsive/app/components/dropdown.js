const Component = require('react').Component;
const PropTypes = require('react').PropTypes;
const h = require('react-hyperscript');
const MenuDroppo = require('menu-droppo');

class Dropdown extends Component {
  render() {
    const { isOpen, onClickOutside, style, children } = this.props;

    return h(
      MenuDroppo,
      {
        isOpen,
        zIndex: 11,
        onClickOutside,
        style,
        innerStyle: {
          borderRadius: '4px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.8)',
          boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
        },
      },
      children,
    );
  }
}

Dropdown.propTypes = {
  isOpen: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  style: PropTypes.object.isRequired,  
}

class DropdownMenuItem extends Component {
  render() {
    const { onClick, closeMenu, children } = this.props;

    return h(
      'li',
      {
        onClick,
        closeMenu,
        style: {
          listStyle: 'none',
          padding: '8px 0px 8px 0px',
          fontSize: '12px',
          fontStyle: 'normal',
          fontFamily: 'Montserrat Regular',
          color: 'rgb(185, 185, 185)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'flex-start',
        },
      },
      children
    );
  }
}

DropdownMenuItem.propTypes = {
  closeMenu: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

module.exports = {
  Dropdown,
  DropdownMenuItem,
};