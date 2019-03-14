const Component = require('react').Component
const { Switch, Route, matchPath } = require('react-router-dom')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../store/actions')
const { getCurrentViewContext } = require('../../selectors/selectors')
const classnames = require('classnames')
const NewAccountCreateForm = require('./new-account')
const NewAccountImportForm = require('./import-account')
const ConnectHardwareForm = require('./connect-hardware')
const {
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
} = require('../../helpers/constants/routes')

class CreateAccountPage extends Component {
  renderTabs () {
    const { history, location } = this.props

    return h('div.new-account__tabs', [
      h('div.new-account__tabs__tab', {
        className: classnames('new-account__tabs__tab', {
          'new-account__tabs__selected': matchPath(location.pathname, {
            path: NEW_ACCOUNT_ROUTE, exact: true,
          }),
        }),
        onClick: () => history.push(NEW_ACCOUNT_ROUTE),
      }, [
        this.context.t('create'),
      ]),

      h('div.new-account__tabs__tab', {
        className: classnames('new-account__tabs__tab', {
          'new-account__tabs__selected': matchPath(location.pathname, {
            path: IMPORT_ACCOUNT_ROUTE, exact: true,
          }),
        }),
        onClick: () => history.push(IMPORT_ACCOUNT_ROUTE),
      }, [
        this.context.t('import'),
      ]),
      h(
        'div.new-account__tabs__tab',
        {
          className: classnames('new-account__tabs__tab', {
            'new-account__tabs__selected': matchPath(location.pathname, {
              path: CONNECT_HARDWARE_ROUTE,
              exact: true,
            }),
          }),
          onClick: () => history.push(CONNECT_HARDWARE_ROUTE),
        },
        this.context.t('connect')
      ),
    ])
  }

  render () {
    return h('div.new-account', {}, [
      h('div.new-account__header', [
        h('div.new-account__title', this.context.t('newAccount')),
        this.renderTabs(),
      ]),
      h('div.new-account__form', [
        h(Switch, [
          h(Route, {
            exact: true,
            path: NEW_ACCOUNT_ROUTE,
            component: NewAccountCreateForm,
          }),
          h(Route, {
            exact: true,
            path: IMPORT_ACCOUNT_ROUTE,
            component: NewAccountImportForm,
          }),
          h(Route, {
            exact: true,
            path: CONNECT_HARDWARE_ROUTE,
            component: ConnectHardwareForm,
          }),
        ]),
      ]),
    ])
  }
}

CreateAccountPage.propTypes = {
  location: PropTypes.object,
  history: PropTypes.object,
  t: PropTypes.func,
}

CreateAccountPage.contextTypes = {
  t: PropTypes.func,
}

const mapStateToProps = state => ({
  displayedForm: getCurrentViewContext(state),
})

const mapDispatchToProps = dispatch => ({
  displayForm: form => dispatch(actions.setNewAccountForm(form)),
  showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
  showExportPrivateKeyModal: () => {
    dispatch(actions.showModal({ name: 'EXPORT_PRIVATE_KEY' }))
  },
  hideModal: () => dispatch(actions.hideModal()),
  setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),
})

module.exports = connect(mapStateToProps, mapDispatchToProps)(CreateAccountPage)
