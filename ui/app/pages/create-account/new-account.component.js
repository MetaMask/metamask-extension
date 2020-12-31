import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import Button from '../../components/ui/button'

const createRestoreAccountNotice = {
  zh_CN: (
    <ul>
      <li>子账户是通过同一套助记词生成的账户，请务必注意：</li>
      <li>1. 子账户的私钥同样不能分享给别人</li>
      <li>2. 如果你曾创建过子账户，此操作会恢复曾经的子账户</li>
      <li>3. 向子账户转账时，请务必回忆私钥没有泄露</li>
      <li>4. 帮他人创建账户，请使用另一套新的助记词</li>
    </ul>
  ),
  en: (
    <ul>
      <li>
        A sub-account is an account generated from a set of the same seed words,
        please be aware：
      </li>
      <li>1.The private key of the sub-account cannot be shared with others</li>
      <li>
        2. If you have created a sub-account, this operation will restore it
      </li>
      <li>
        3. When transferring money to a sub-account, please make sure that the
        private key is not leaked
      </li>
      <li>
        4. To help others create accounts, please use another new seed words
      </li>
    </ul>
  ),
}

export default class NewAccountCreateForm extends Component {
  static defaultProps = {
    newAccountNumber: 0,
  }

  state = {
    newAccountName: '',
    defaultAccountName: this.context.t('newAccountNumberName', [
      this.props.newAccountNumber,
    ]),
  }

  render() {
    const { newAccountName, defaultAccountName } = this.state
    const { history, createAccount, currentLocale } = this.props
    const createClick = _ => {
      createAccount(newAccountName || defaultAccountName)
        .then(() => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Add New Account',
              name: 'Added New Account',
            },
          })
          history.push(DEFAULT_ROUTE)
        })
        .catch(e => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Add New Account',
              name: 'Error',
            },
            customVariables: {
              errorMessage: e.message,
            },
          })
        })
    }

    return (
      <div className="new-account-create-form">
        <div className="new-account-create-form__input-label">
          {this.context.t('accountName')}
        </div>
        <div className="new-account-create-form__input-wrapper">
          <input
            className="new-account-create-form__input"
            value={newAccountName}
            placeholder={defaultAccountName}
            onChange={event =>
              this.setState({ newAccountName: event.target.value })
            }
          />
        </div>
        <div className="new-account-create-form__notice">
          {createRestoreAccountNotice[currentLocale]}
        </div>
        <div className="new-account-create-form__buttons">
          <Button
            type="default"
            large
            className="new-account-create-form__button"
            onClick={() => history.push(DEFAULT_ROUTE)}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="secondary"
            large
            className="new-account-create-form__button"
            onClick={createClick}
          >
            {this.context.t('submitCreateRestoreAccount')}
          </Button>
        </div>
      </div>
    )
  }
}

NewAccountCreateForm.propTypes = {
  currentLocale: PropTypes.string,
  createAccount: PropTypes.func,
  newAccountNumber: PropTypes.number,
  history: PropTypes.object,
}

NewAccountCreateForm.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}
