const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')


inherits(NetworkDropdownIcon, Component)
module.exports = NetworkDropdownIcon

function NetworkDropdownIcon () {
  Component.call(this)
}

NetworkDropdownIcon.prototype.render = function () {
  const {
    backgroundColor,
    isSelected,
    innerBorder = 'none',
    diameter = '12',
    loading,
  } = this.props

  return loading
    ? h('span.pointer.network-indicator', {
      style: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
      },
    }, [
      h('img', {
        style: {
          width: '27px',
        },
        src: 'images/loading.svg',
      }),
    ])
    : h(`.menu-icon-circle${isSelected ? '--active' : ''}`, {},
      h('div', {
        style: {
          background: backgroundColor,
          border: innerBorder,
          height: `${diameter}px`,
          width: `${diameter}px`,
        },
      })
    )
}
<<<<<<< HEAD
=======

NetworkDropdownIcon.defaultProps = {
  backgroundColor: undefined,
  loading: false,
  innerBorder: 'none',
  diameter: '12',
  isSelected: false,
}

NetworkDropdownIcon.propTypes = {
  backgroundColor: PropTypes.string,
  loading: PropTypes.bool,
  innerBorder: PropTypes.string,
  diameter: PropTypes.string,
  isSelected: PropTypes.bool,
}

export default NetworkDropdownIcon
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
