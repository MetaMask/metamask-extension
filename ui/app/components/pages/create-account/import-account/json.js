const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const connect = require('react-redux').connect
const actions = require('../../../../actions')
const FileInput = require('react-simple-file-input').default
const { DEFAULT_ROUTE } = require('../../../../routes')
const HELP_LINK = 'https://support.metamask.io/kb/article/7-importing-accounts'

class JsonImportSubview extends Component {
  constructor (props) {
    super(props)

    this.state = {
      file: null,
      fileContents: '',
    }
  }

  render () {
    const { error } = this.props

    return (
      h('div.new-account-import-form__json', [

        h('p', this.context.t('usedByClients')),
        h('a.warning', {
          href: HELP_LINK,
          target: '_blank',
        }, this.context.t('fileImportFail')),

        h(FileInput, {
          readAs: 'text',
          onLoad: this.onLoad.bind(this),
          style: {
            margin: '20px 0px 12px 34%',
            fontSize: '15px',
            display: 'flex',
            justifyContent: 'center',
          },
        }),

        h('input.new-account-import-form__input-password', {
          type: 'password',
          placeholder: this.context.t('enterPassword'),
          id: 'json-password-box',
          onKeyPress: this.createKeyringOnEnter.bind(this),
        }),

        h('div.new-account-create-form__buttons', {}, [

          h('button.btn-default.new-account-create-form__button', {
            onClick: () => this.props.history.push(DEFAULT_ROUTE),
          }, [
            this.context.t('cancel'),
          ]),

          h('button.btn-primary.new-account-create-form__button', {
            onClick: () => this.createNewKeychain(),
          }, [
            this.context.t('import'),
          ]),

        ]),

        error ? h('span.error', error) : null,
      ])
    )
  }

  onLoad (event, file) {
    this.setState({file: file, fileContents: event.target.result})
  }

  createKeyringOnEnter (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.createNewKeychain()
    }
  }

  createNewKeychain () {
    const { firstAddress, displayWarning, importNewJsonAccount, setSelectedAddress } = this.props
    const state = this.state

    if (!state) {
      const message = this.context.t('validFileImport')
      return displayWarning(message)
    }

    const { fileContents } = state

    if (!fileContents) {
      const message = this.context.t('needImportFile')
      return displayWarning(message)
    }

    const passwordInput = document.getElementById('json-password-box')
    const password = passwordInput.value

    if (!password) {
      const message = this.context.t('needImportPassword')
      return displayWarning(message)
    }

    importNewJsonAccount([ fileContents, password ])
      .then(({ selectedAddress }) => {
        if (selectedAddress) {
          history.push(DEFAULT_ROUTE)
          displayWarning(null)
        } else {
          displayWarning('Error importing account.')
          setSelectedAddress(firstAddress)
        }
      })
      .catch(err => err && displayWarning(err.message || err))
  }
}

JsonImportSubview.propTypes = {
  error: PropTypes.string,
  goHome: PropTypes.func,
  displayWarning: PropTypes.func,
  firstAddress: PropTypes.string,
  importNewJsonAccount: PropTypes.func,
  history: PropTypes.object,
  setSelectedAddress: PropTypes.func,
  t: PropTypes.func,
}

const mapStateToProps = state => {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(state.metamask.accounts)[0],
  }
}

const mapDispatchToProps = dispatch => {
  return {
    goHome: () => dispatch(actions.goHome()),
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    importNewJsonAccount: options => dispatch(actions.importNewAccount('JSON File', options)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
  }
}

JsonImportSubview.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(JsonImportSubview)
