const connect = require('react-redux').connect
const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('./actions')

module.exports = connect(mapStateToProps)(EthStoreWarning)

inherits(EthStoreWarning, Component)
function EthStoreWarning () {
  Component.call(this)
}

function mapStateToProps (state) {
  return {
    selectedAccount: state.metamask.selectedAccount,
  }
}

EthStoreWarning.prototype.render = function () {

  return (

    h('.flex-column', {
      key: 'ethWarning',
      style: {
        paddingTop: '25px',
        marginRight: '30px',
        marginLeft: '30px',
        alignItems: 'center',
      },
    }, [
      h('.warning', {
        style: {
          margin: '0px 10px 10px 10px',
        },
      },
        `The MetaMask team would like to
        remind you that MetaMask is currently in beta - so
        don't store large
        amounts of ether in MetaMask.
        `),

      h('i.fa.fa-exclamation-triangle.fa-4', {
        style: {
          fontSize: '152px',
          color: '#AEAEAE',
          textAlign: 'center',
        },
      }),

      h('.flex-row', {
        style: {
          marginTop: '25px',
          marginBottom: '10px',
        },
      }, [
        h('input', {
          type: 'checkbox',
          onChange: this.toggleShowWarning.bind(this, event),
        }),
        h('.warning', {
          style: {
            fontSize: '11px',
          },

        }, "Don't show me this message again"),
      ]),
      h('.flex-row', {
        style: {
          width: '100%',
          justifyContent: 'space-around',
        },
      }, [
        h('button', {
          onClick: this.toAccounts.bind(this),
        },
          'Continue to MetaMask'),
      ]),
    ])
  )
}

EthStoreWarning.prototype.toggleShowWarning = function (event) {
  this.props.dispatch(actions.agreeToEthWarning())
}

EthStoreWarning.prototype.toAccounts = function () {
  this.props.dispatch(actions.showAccountDetail(this.props.account))
}
