import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import ConfirmTransactionBase from '../confirm-transaction-base'

export default class ConfirmDeployContract extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    txData: PropTypes.object,
  }

  renderData() {
    const { t } = this.context
    const { txData: { origin, txParams: { data } = {} } = {} } = this.props

    return (
      <div className="confirm-page-container-content__data">
        <div className="confirm-page-container-content__data-box">
          <div className="confirm-page-container-content__data-field">
            <div className="confirm-page-container-content__data-field-label">
              {`${t('origin')}:`}
            </div>
            <div>{origin}</div>
          </div>
          <div className="confirm-page-container-content__data-field">
            <div className="confirm-page-container-content__data-field-label">
              {`${t('bytes')}:`}
            </div>
            <div>{ethUtil.toBuffer(data).length}</div>
          </div>
        </div>
        <div className="confirm-page-container-content__data-box-label">
          {`${t('hexData')}:`}
        </div>
        <div className="confirm-page-container-content__data-box">{data}</div>
      </div>
    )
  }

  render() {
    return (
      <ConfirmTransactionBase
        actionKey="contractDeployment"
        dataComponent={this.renderData()}
      />
    )
  }
}
