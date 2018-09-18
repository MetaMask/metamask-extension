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
    h('.flex-row.space-around', {
      style: {
        background: '#60269c',
        color: '#AEAEAE',
        paddingTop: '10px',
        minHeight: '45px',
        lineHeight: '45px',
      },
    }, tabs.map((tab, ind) => {
      const { key, content, id } = tab
      return h(`${key ? '#' + key : ''}${subview === key ? ind === 0 ? '.activeForm.left' : '.activeForm.right' : '.inactiveForm.pointer'}`, {
        onClick: () => {
          this.setState({ subview: key })
          tabSelected(key)
        },
        id: id,
      }, content)
    }))
  )
}

