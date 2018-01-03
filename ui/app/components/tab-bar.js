const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('react').PropTypes
const classnames = require('classnames')

class TabBar extends Component {
  constructor (props) {
    super(props)
    const { defaultTab, tabs } = props

    this.state = {
      subview: defaultTab || tabs[0].key,
    }
  }

  render () {
    const { tabs = [], tabSelected } = this.props
    const { subview } = this.state

    return (
      h('.tab-bar', {}, [
        tabs.map((tab) => {
          const { key, content } = tab
          return h('div', {
            className: classnames('tab-bar__tab pointer', {
              'tab-bar__tab--active': subview === key,
            }),
            onClick: () => {
              this.setState({ subview: key })
              tabSelected(key)
            },
            key,
          }, content)
        }),
        h('div.tab-bar__tab.tab-bar__grow-tab'),
      ])
    )
  }
}

TabBar.propTypes = {
  defaultTab: PropTypes.string,
  tabs: PropTypes.array,
  tabSelected: PropTypes.func,
}

module.exports = TabBar
