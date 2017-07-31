const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../../actions')

module.exports = connect(mapStateToProps)(SeedWordConfirmation)

inherits(SeedWordConfirmation, Component)

function SeedWordConfirmation () {
  Component.call(this)
}

function mapStateToProps (state) {
  return {
    seed: state.appState.currentView.seedWords,
    cacheSeed: state.metamask.seedWords,
  }
}

SeedWordConfirmation.prototype.render = function () {
  var state = this.mapStateToProps
  // var seed = state.seed || state.cachedSeed || ''

  return (
    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      h('.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick (event) {
            event.preventDefault()
            state.dispatch(actions.revealSeedConfirmation())
          },
        }),
        h('h2.page-subtitle', 'Confirm Seed Phrase'),
      ]),

      h('textarea.twelve-word-phrase', {
        value: '',
      }),

      h('button.primary', {
        onClick: () => this.confirmSeedWords(),
        style: {
          margin: '24px',
          fontSize: '0.9em',
        },
      }, 'Changed View'),
    ])
  )
}

SeedWordConfirmation.prototype.confirmSeedWords = function () {
  this.props.dispatch(actions.confirmSeedWords())
}
