const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const findDOMNode = require('react-dom').findDOMNode
const ReactTooltip = require('react-tooltip')

module.exports = NewTooltip

inherits(NewTooltip, Component)
function NewTooltip () {
  Component.call(this)
  this.state = {
    tooltipNode: null,
    tooltipBase: null,
  }

  // this.pageClick = this.pageClick.bind(this)
}

// NewTooltip.prototype.pageClick = function (e) {
//   // event.preventDefault();
//   const tooltipNode = this.state.tooltipNode
//   console.log(`e.target`, e.target);
//   console.log(`tooltipNode.contains(e.target)`, tooltipNode.contains(e.target));
// },

NewTooltip.prototype.componentDidMount = function () {
  const tooltipNode = findDOMNode(this);
  const tooltipBase = findDOMNode(this.refs.tester)

  this.setState({ tooltipBase, tooltipNode })
}

NewTooltip.prototype.componentDidUpdate = function () {
  const { show } = this.props
  const tooltipBase = this.state.tooltipBase
  const tooltipNode = this.state.tooltipNode
  
  if (show) {
    ReactTooltip.show(tooltipBase)
  }
  else {
    ReactTooltip.hide(tooltipBase)
  } 
}

NewTooltip.prototype.render = function () {
  const props = this.props
  const { position, title, children } = props

  return h('div', {}, [
    h('div', {
      'data-tip': 'test',
      'data-for': 'something',
      'ref': 'tester',
    }),
    h(ReactTooltip, {
      place: position || 'top',
      effect: 'solid',
      id: 'something',
      className: 'send-tooltip',
      type: 'light',
    }, children),
  ])
    
}
