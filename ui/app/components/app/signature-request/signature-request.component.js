import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Header from './signature-request-header'
import Footer from './signature-request-footer'
import { ENVIRONMENT_TYPE_NOTIFICATION } from './signature-request.constants'
import { ObjectInspector } from 'react-inspector'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'

export default class SignatureRequest extends PureComponent {
  static propTypes = {
    txData: PropTypes.object.isRequired,
    accounts: PropTypes.PropTypes.shape(
      PropTypes.shape({
        address: PropTypes.string,
        balance: PropTypes.string,
      })
    ),
    blockGasLimit: PropTypes.string.isRequired,
    conversionRate: PropTypes.number.isRequired,
    currentCurrency: PropTypes.string.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    selectedAccount: PropTypes.shape({
      address: PropTypes.string,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,

    clearConfirmTransaction: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    sign: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  componentDidMount () {
    const { clearConfirmTransaction, cancel } = this.props
    const { metricsEvent } = this.context
    if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.onbeforeunload = event => {
        metricsEvent({
          eventOpts: {
            category: 'Transactions',
            action: 'Sign Request',
            name: 'Cancel Sig Request Via Notification Close',
          },
        })
        clearConfirmTransaction()
        cancel(event)
      }
    }
  }

  render () {
    const {
      selectedAccount,
      accounts,
      txData: { msgParams: { data }},
      cancel,
      sign,
    } = this.props
    const { message, domain } = JSON.parse(data)

    return (
      <div className="signature-request">
        <Header selectedAccount={selectedAccount} accounts={accounts} />
        <div className="signature-request-content">
          {this.context.t('sigRequest')}
          <div>{message.from.name}<br />{message.from.wallet}</div>
        </div>
        <div className="signature-request-message">
        <h2>{this.context.t('signatureRequest1')}</h2>
          <ObjectInspector data={domain} expandLevel={1} name="domain" />
        </div>
        <Footer cancelAction={cancel} signAction={sign} />
      </div>
    )
  }
}
