const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../actions')

module.exports = connect(mapStateToProps)(CreateVaultCompleteScreen)


inherits(CreateVaultCompleteScreen, Component)
function CreateVaultCompleteScreen() {
  Component.call(this)
}

function mapStateToProps(state) {
  return {
    seed: state.appState.currentView.context,
    cachedSeed: state.metamask.seedWords,
  }
}

CreateVaultCompleteScreen.prototype.render = function() {
  var state = this.props
  var seed = state.seed || state.cachedSeed

  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      // // subtitle and nav
      // h('.section-title.flex-row.flex-center', [
      //   h('h2.page-subtitle', 'Vault Created'),
      // ]),

      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginTop: 36,
          marginBottom: 8,
          width: '100%',
          fontSize: '20px',
          padding: 6,
        },
      }, [
        'Vault Created',
      ]),

      h('span.error', { // Error for the right red
        style: {
          padding: '12px 20px 0px 20px',
          textAlign: 'center',
        }
      }, 'These 12 words can restore all of your MetaMask accounts for this vault.\nSave them somewhere safe and secret.'),

      h('textarea.twelve-word-phrase', {
        readOnly: true,
        value: seed,
      }),

      h('button.primary', {
        onClick: () => this.confirmSeedWords(),
        style: {
          margin: '24px',
        },
      }, 'I\'ve copied it somewhere safe'),
    ])
  )
}

CreateVaultCompleteScreen.prototype.confirmSeedWords = function() {
  this.props.dispatch(actions.confirmSeedWords())
}

