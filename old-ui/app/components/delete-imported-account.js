const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')

module.exports = connect(mapStateToProps)(DeleteImportedAccount)

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    identity: state.appState.identity,
    provider: state.metamask.provider,
  }
}

inherits(DeleteImportedAccount, Component)
function DeleteImportedAccount () {
  Component.call(this)
}

DeleteImportedAccount.prototype.render = function () {
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
      h('h2.page-subtitle', 'Delete Imported Account'),
    ]),
    h('div', {
      style: {
        margin: '0px 30px 20px',
      },
    },
    h('.error', 'Be sure, that you saved a private key or JSON keystore file of this account in a safe place. Otherwise, you will not be able to restore this account.'),
    ),
    h('p.confirm-label', {
        style: {
          textAlign: 'center',
          margin: '0px 30px 20px ',
        },
      },
      `Are you sure to delete imported ${this.props.identity.name} (${this.props.identity.address})?`),
    h('.flex-row.flex-right', {
      style: {
        marginRight: '30px',
      },
    }, [
      h('button.btn-violet',
        {
          style: {
            marginRight: '10px',
          },
          onClick: () => {
            this.props.dispatch(actions.showConfigPage())
          },
        },
        'No'),
      h('button',
        {
          onClick: () => {
            this.props.dispatch(actions.removeAccount(this.props.identity.address))
              .then(() => {
                this.props.dispatch(actions.showConfigPage())
              })
          },
        },
        'Yes'),
    ]),
  ])
}
