const { withRouter } = require('react-router-dom')
const PropTypes = require('prop-types')
const { compose } = require('recompose')
const PersistentForm = require('../../../../lib/persistent-form')
const { connect } = require('react-redux')
const h = require('react-hyperscript')
const { createNewVaultAndRestore } = require('../../../actions')
const { DEFAULT_ROUTE } = require('../../../routes')

class RestoreVaultPage extends PersistentForm {
  constructor (props) {
    super(props)

    this.state = {
      error: null,
    }
  }

  createOnEnter (event) {
    if (event.key === 'Enter') {
      this.createNewVaultAndRestore()
    }
  }

  createNewVaultAndRestore () {
    this.setState({ error: null })

    // check password
    var passwordBox = document.getElementById('password-box')
    var password = passwordBox.value
    var passwordConfirmBox = document.getElementById('password-box-confirm')
    var passwordConfirm = passwordConfirmBox.value

    if (password.length < 8) {
      this.setState({ error: 'Password not long enough' })
      return
    }

    if (password !== passwordConfirm) {
      this.setState({ error: 'Passwords don\'t match' })
      return
    }

    // check seed
    var seedBox = document.querySelector('textarea.twelve-word-phrase')
    var seed = seedBox.value.trim()
    if (seed.split(' ').length !== 12) {
      this.setState({ error: 'Seed phrases are 12 words long' })
      return
    }

    // submit
    this.props.createNewVaultAndRestore(password, seed)
      .then(() => history.push(DEFAULT_ROUTE))
      .catch(({ message }) => this.setState({ error: message }))
  }

  render () {
    const { error } = this.state
    const { history } = this.props
    this.persistentFormParentId = 'restore-vault-form'

    return (
      h('.initialize-screen.flex-column.flex-center.flex-grow', [

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
          'Restore Vault',
        ]),

        // wallet seed entry
        h('h3', 'Wallet Seed'),
        h('textarea.twelve-word-phrase.letter-spacey', {
          dataset: {
            persistentFormId: 'wallet-seed',
          },
          placeholder: 'Enter your secret twelve word phrase here to restore your vault.',
        }),

        // password
        h('input.large-input.letter-spacey', {
          type: 'password',
          id: 'password-box',
          placeholder: 'New Password (min 8 chars)',
          dataset: {
            persistentFormId: 'password',
          },
          style: {
            width: 260,
            marginTop: 12,
          },
        }),

        // confirm password
        h('input.large-input.letter-spacey', {
          type: 'password',
          id: 'password-box-confirm',
          placeholder: 'Confirm Password',
          onKeyPress: this.createOnEnter.bind(this),
          dataset: {
            persistentFormId: 'password-confirmation',
          },
          style: {
            width: 260,
            marginTop: 16,
          },
        }),

        error && (
          h('span.error.in-progress-notification', error)
        ),

        // submit
        h('.flex-row.flex-space-between', {
          style: {
            marginTop: 30,
            width: '50%',
          },
        }, [

          // cancel
          h('button.primary', { onClick: () => history.goBack() }, 'CANCEL'),

          // submit
          h('button.primary', {
            onClick: this.createNewVaultAndRestore.bind(this),
          }, 'OK'),

        ]),
      ])
    )
  }
}

RestoreVaultPage.propTypes = {
  history: PropTypes.object,
}

const mapStateToProps = state => {
  const { appState: { warning, forgottenPassword } } = state

  return {
    warning,
    forgottenPassword,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    createNewVaultAndRestore: (password, seed) => {
      return dispatch(createNewVaultAndRestore(password, seed))
    },
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(RestoreVaultPage)
