const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect

const actions = require('../actions.js')
const Tooltip = require('./tooltip')
module.exports = connect(mapStateToProps)(RetryTxButton)

inherits(RetryTxButton, Component)

function mapStateToProps (state) {
  return {}
}

inherits(RetryTxButton, Component)
function RetryTxButton () {
  Component.call(this)
}

RetryTxButton.prototype.render = function () {
  const props = this.props

  return h('.cursor-pointer', {}, [
    h(Tooltip, {
      title: 'Resubmit',
    }, [
      h('i.fa.fa-refresh ', {
        style: {
          paddingTop: '12px',
          fontSize: '20px',
        },
        onClick: (event) => {
          event.stopPropagation()
          this.props.dispatch(actions.resendTx(props.transaction))
        },
      }),
    ]),
  ])
}
