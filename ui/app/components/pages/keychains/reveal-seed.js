const { Component } = require('react')
const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { exportAsFile } = require('../../../util')
const { requestRevealSeed, confirmSeedWords } = require('../../../actions')
const { DEFAULT_ROUTE } = require('../../../routes')

class RevealSeedPage extends Component {
  componentDidMount () {
    const passwordBox = document.getElementById('password-box')
    if (passwordBox) {
      passwordBox.focus()
    }
  }

  checkConfirmation (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.revealSeedWords()
    }
  }

  revealSeedWords () {
    const password = document.getElementById('password-box').value
    this.props.requestRevealSeed(password)
  }

  renderSeed () {
    const { seedWords, confirmSeedWords, history } = this.props

    return (
      h('.initialize-screen.flex-column.flex-center.flex-grow', [

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

        h('div', {
          style: {
            fontSize: '1em',
            marginTop: '10px',
            textAlign: 'center',
          },
        }, [
          h('span.error', 'These 12 words are the only way to restore your MetaMask accounts.\nSave them somewhere safe and secret.'),
        ]),

        h('textarea.twelve-word-phrase', {
          readOnly: true,
          value: seedWords,
        }),

        h('button.primary', {
          onClick: () => confirmSeedWords().then(() => history.push(DEFAULT_ROUTE)),
          style: {
            margin: '24px',
            fontSize: '0.9em',
            marginBottom: '10px',
          },
        }, 'I\'ve copied it somewhere safe'),

        h('button.primary', {
          onClick: () => exportAsFile(`MetaMask Seed Words`, seedWords),
          style: {
            margin: '10px',
            fontSize: '0.9em',
          },
        }, 'Save Seed Words As File'),
      ])
    )
  }

  renderConfirmation () {
    const { history, warning, inProgress } = this.props

    return (
      h('.initialize-screen.flex-column.flex-center.flex-grow', {
        style: { maxWidth: '420px' },
      }, [

        h('h3.flex-center.text-transform-uppercase', {
          style: {
            background: '#EBEBEB',
            color: '#AEAEAE',
            marginBottom: 24,
            width: '100%',
            fontSize: '20px',
            padding: 6,
          },
        }, [
          'Reveal Seed Words',
        ]),

        h('.div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            justifyContent: 'center',
          },
        }, [

          h('h4', 'Do not recover your seed words in a public place! These words can be used to steal all your accounts.'),

          // confirmation
          h('input.large-input.letter-spacey', {
            type: 'password',
            id: 'password-box',
            placeholder: 'Enter your password to confirm',
            onKeyPress: this.checkConfirmation.bind(this),
            style: {
              width: 260,
              marginTop: '12px',
            },
          }),

          h('.flex-row.flex-start', {
            style: {
              marginTop: 30,
              width: '50%',
            },
          }, [
            // cancel
            h('button.primary', {
              onClick: () => history.goBack(),
            }, 'CANCEL'),

            // submit
            h('button.primary', {
              style: { marginLeft: '10px' },
              onClick: this.revealSeedWords.bind(this),
            }, 'OK'),

          ]),

          warning && (
            h('span.error', {
              style: {
                margin: '20px',
              },
            }, warning.split('-'))
          ),

          inProgress && (
            h('span.in-progress-notification', 'Generating Seed...')
          ),
        ]),
      ])
    )
  }

  render () {
    return this.props.seedWords
      ? this.renderSeed()
      : this.renderConfirmation()
  }
}

RevealSeedPage.propTypes = {
  requestRevealSeed: PropTypes.func,
  confirmSeedWords: PropTypes.func,
  seedWords: PropTypes.string,
  inProgress: PropTypes.bool,
  history: PropTypes.object,
  warning: PropTypes.string,
}

const mapStateToProps = state => {
  const { appState: { warning }, metamask: { seedWords } } = state

  return {
    warning,
    seedWords,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    requestRevealSeed: password => dispatch(requestRevealSeed(password)),
    confirmSeedWords: () => dispatch(confirmSeedWords()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(RevealSeedPage)
