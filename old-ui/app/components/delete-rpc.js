const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')

module.exports = connect(mapStateToProps)(DeleteRpc)

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    url: state.appState.RPC_URL ? state.appState.RPC_URL : state.metamask.provider.rpcTarget,
    provider: state.metamask.provider,
  }
}

inherits(DeleteRpc, Component)
function DeleteRpc () {
  Component.call(this)
}

DeleteRpc.prototype.render = function () {
  return h('.flex-column.flex-grow', {
    style: {
      overflowX: 'auto',
      overflowY: 'hidden',
    },
  }, [
    // subtitle and nav
    h('.section-title.flex-row.flex-center', [
      h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
        onClick: () => {
          this.props.dispatch(actions.showConfigPage())
        },
        style: {
          position: 'absolute',
          left: '30px',
        },
      }),
      h('h2.page-subtitle', 'Delete Custom RPC'),
    ]),
    h('p.confirm-label', {
        style: {
          textAlign: 'center',
          margin: '0px 30px 20px ',
        },
      },
      `Are you sure to delete ${this.props.url} ?`),
    h('.flex-row.flex-right', {
      style: {
        marginRight: '30px',
      },
    }, [
      h('button.btn-violet',
        {
          onClick: () => {
            this.props.dispatch(actions.showConfigPage())
          },
        },
        'No'),
      h('button',
        {
          onClick: () => {
            this.props.dispatch(actions.removeCustomRPC(this.props.url, this.props.provider))
              .then(() => {
                this.props.dispatch(actions.showConfigPage())
              })
          },
        },
        'Yes'),
    ]),
  ])
}
