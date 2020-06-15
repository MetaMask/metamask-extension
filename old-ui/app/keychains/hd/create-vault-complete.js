import { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
const h = require('react-hyperscript')
const { confirmSeedWords, showAccountDetail } = require('../../../../ui/app/actions')
const { exportAsFile } = require('../../util')

class CreateVaultCompleteScreen extends Component {

  static propTypes = {
    seed: PropTypes.string,
    cachedSeed: PropTypes.string,
    confirmSeedWords: PropTypes.func,
    showAccountDetail: PropTypes.func,
  };

  render () {
    const state = this.props
    const seed = state.seed || state.cachedSeed || ''
    const wordsCount = seed.split(' ').length

    return (

      h('.initialize-screen.flex-column.flex-center.flex-grow', [

        h('h3.flex-center.section-title', {
          style: {
            background: '#ffffff',
            color: '#333333',
            marginBottom: 8,
            width: '100%',
            padding: '30px 6px 6px 6px',
          },
        }, [
          'Vault Created',
        ]),

        h('div', {
          style: {
            fontSize: '1em',
            margin: '10px 30px',
            textAlign: 'center',
          },
        }, [
          h('div.error', `These ${wordsCount} words are the only way to restore your Nifty Wallet accounts.\nSave them somewhere safe and secret.`),
        ]),

        h('textarea.twelve-word-phrase', {
          readOnly: true,
          value: seed,
        }),

        h('button', {
          onClick: () => this.confirmSeedWords()
            .then(account => this.showAccountDetail(account)),
          style: {
            margin: '24px',
            fontSize: '0.9em',
            marginBottom: '10px',
          },
        }, 'I\'ve copied it somewhere safe'),

        h('button', {
          onClick: () => exportAsFile(`Nifty Wallet Seed Words`, seed),
          style: {
            margin: '10px',
            fontSize: '0.9em',
          },
        }, 'Save Seed Words As File'),
      ])
    )
  }

  confirmSeedWords () {
    return this.props.confirmSeedWords()
  }

  showAccountDetail (account) {
    return this.props.showAccountDetail(account)
  }
}

function mapStateToProps (state) {
  return {
    seed: state.appState.currentView.seedWords,
    cachedSeed: state.metamask.seedWords,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    confirmSeedWords: () => dispatch(confirmSeedWords()),
    showAccountDetail: (account) => dispatch(showAccountDetail(account)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(CreateVaultCompleteScreen)
