const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const classnames = require('classnames')

class TabBar extends Component {
  render () {
    const { tabs = [], onSelect, isActive } = this.props

    return (
      h('.tab-bar', {}, [
        tabs.map(({ key, content }) => {
          return h('div', {
            className: classnames('tab-bar__tab pointer', {
              'tab-bar__tab--active': isActive(key, content),
            }),
            onClick: () => onSelect(key),
            key,
          }, content)
        }),
        h('div.tab-bar__tab.tab-bar__grow-tab'),
      ])
    )
  }
}

TabBar.propTypes = {
  isActive: PropTypes.func.isRequired,
  tabs: PropTypes.array,
  onSelect: PropTypes.func,
}

module.exports = TabBar
