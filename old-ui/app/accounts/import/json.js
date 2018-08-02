const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../../ui/app/actions')
const FileInput = require('react-simple-file-input').default
const PropTypes = require('prop-types')

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
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '5px 30px 0px 30px',
        },
      }, [

        h('p', 'Used by a variety of different clients'),

        h(FileInput, {
          readAs: 'text',
          onLoad: this.onLoad.bind(this),
          style: {
            margin: '20px 0px 12px 20px',
            fontSize: '15px',
          },
        }),

        h('input.large-input.letter-spacey', {
          type: 'password',
          placeholder: 'Enter password',
          id: 'json-password-box',
          onKeyPress: this.createKeyringOnEnter.bind(this),
          style: {
            width: '100%',
            marginTop: 12,
            border: '1px solid #e2e2e2',
          },
        }),

        h('button', {
          onClick: this.createNewKeychain.bind(this),
          style: {
            margin: 20,
          },
        }, 'Import'),

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
    const { fileContents } = this.state

    if (!fileContents) {
      const message = 'You must select a file to import.'
      return this.props.displayWarning(message)
    }

    const passwordInput = document.getElementById('json-password-box')
    const password = passwordInput.value

    if (!password) {
      const message = 'You must enter a password for the selected file.'
      return this.props.displayWarning(message)
    }

    this.props.importNewAccount([ fileContents, password ])
      // JS runtime requires caught rejections but failures are handled by Redux
      .catch()
  }
}

JsonImportSubview.propTypes = {
  error: PropTypes.string,
  displayWarning: PropTypes.func,
  importNewAccount: PropTypes.func,
}

const mapStateToProps = state => {
  return {
    error: state.appState.warning,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    goHome: () => dispatch(actions.goHome()),
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    importNewAccount: options => dispatch(actions.importNewAccount('JSON File', options)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(JsonImportSubview)
