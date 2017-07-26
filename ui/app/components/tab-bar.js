const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = TabBar

inherits(TabBar, Component)
function TabBar () {
  Component.call(this)
}

TabBar.prototype.render = function () {
  const props = this.props
  const state = this.state || {}
  const { tabs = [], defaultTab, tabSelected } = props
  const { subview = defaultTab } = state

  return (
    h('.flex-row.space-around.text-transform-uppercase', {
      style: {
        background: '#EBEBEB',
        color: '#AEAEAE',
        paddingTop: '4px',
        minHeight: '30px',
      },
    }, tabs.map((tab) => {
      const { key, content } = tab
      return h(subview === key ? '.activeForm' : '.inactiveForm.pointer', {
        onClick: () => {
          this.setState({ subview: key })
          tabSelected(key)
        },
      }, content)
    }))
  )
}

