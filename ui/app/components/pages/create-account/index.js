const Component = require('react').Component
const { Switch, Route, matchPath } = require('react-router-dom')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../actions')
const { getCurrentViewContext } = require('../../../selectors')
const classnames = require('classnames')
const NewAccountCreateForm = require('./new-account')
const NewAccountImportForm = require('./import-account')
const { NEW_ACCOUNT_ROUTE, IMPORT_ACCOUNT_ROUTE } = require('../../../routes')

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
      }, 'Create'),

      h('div.new-account__tabs__tab', {
        className: classnames('new-account__tabs__tab', {
          'new-account__tabs__selected': matchPath(location.pathname, {
            path: IMPORT_ACCOUNT_ROUTE, exact: true,
          }),
        }),
        onClick: () => history.push(IMPORT_ACCOUNT_ROUTE),
      }, 'Import'),
    ])
  }

  render () {
    return h('div.new-account', {}, [
      h('div.new-account__header', [
        h('div.new-account__title', 'New Account'),
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
        ]),
      ]),
    ])
  }
}

CreateAccountPage.propTypes = {
  location: PropTypes.object,
  history: PropTypes.object,
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
  saveAccountLabel: (address, label) => dispatch(actions.saveAccountLabel(address, label)),
})

module.exports = connect(mapStateToProps, mapDispatchToProps)(CreateAccountPage)
