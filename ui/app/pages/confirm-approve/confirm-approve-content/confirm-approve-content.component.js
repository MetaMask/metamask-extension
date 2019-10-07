import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../../../components/ui/identicon'
import {
  addressSummary,
} from '../../../helpers/utils/util'

export default class ConfirmApproveContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    amount: PropTypes.string,
    txFeeTotal: PropTypes.string,
    tokenAmount: PropTypes.string,
    customTokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
    siteImage: PropTypes.string,
    tokenAddress: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    showEditApprovalPermissionModal: PropTypes.func,
    origin: PropTypes.string,
    setCustomAmount: PropTypes.func,
    tokenBalance: PropTypes.string,
    data: PropTypes.string,
    toAddress: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
  }

  state = {
    showFullTxDetails: false,
  }

  renderApproveContentCard ({
    symbol,
    title,
    showEdit,
    onEditClick,
    content,
    footer,
    noBorder,
  }) {
    return (
      <div className={classnames({
        'confirm-approve-content__card': !noBorder,
        'confirm-approve-content__card--no-border': noBorder,
      })}>
        <div className="confirm-approve-content__card-header">
          <div className="confirm-approve-content__card-header__symbol">{ symbol }</div>
          <div className="confirm-approve-content__card-header__title">{ title }</div>
          { showEdit && <div
            className="confirm-approve-content__small-blue-text cursor-pointer"
            onClick={() => onEditClick()}
          >Edit</div> }
        </div>
        <div className="confirm-approve-content__card-content">
          { content }
        </div>
        { footer }
      </div>
    )
  }

  renderTransactionDetailsContent () {
    const {
      ethTransactionTotal,
      fiatTransactionTotal,
    } = this.props
    return (
      <div className="confirm-approve-content__transaction-details-content">
        <div className="confirm-approve-content__small-text">
          A fee is associated with this request. Learn why
        </div>
        <div className="confirm-approve-content__transaction-details-content__fee">
          <div className="confirm-approve-content__transaction-details-content__primary-fee">
            { fiatTransactionTotal }
          </div>
          <div className="confirm-approve-content__transaction-details-content__secondary-fee">
            { ethTransactionTotal }
          </div>
        </div>
      </div>
    )
  }

  renderPermissionContent () {
    const { customTokenAmount, tokenAmount, tokenSymbol, origin, toAddress } = this.props

    return (
      <div className="flex-column">
        <div className="confirm-approve-content__small-text">{origin} may access and spend up to this max amount</div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">Amount:</div>
          <div className="confirm-approve-content__medium-text">{ `${customTokenAmount || tokenAmount} ${tokenSymbol}` }</div>
        </div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">To:</div>
          <div className="confirm-approve-content__medium-text">{ addressSummary(toAddress) }</div>
        </div>
      </div>
    )
  }

  renderDataContent () {
    const { data } = this.props
    return (
      <div className="flex-column">
        <div className="confirm-approve-content__small-text">Function: Approve</div>
        <div className="confirm-approve-content__small-text confirm-approve-content__data__data-block">{ data }</div>
      </div>
    )
  }

  render () {
    const {
      siteImage,
      tokenAmount,
      customTokenAmount,
      origin,
      tokenSymbol,
      showCustomizeGasModal,
      showEditApprovalPermissionModal,
      setCustomAmount,
      tokenBalance,
    } = this.props
    const { showFullTxDetails } = this.state

    return (
      <div className={classnames('confirm-approve-content', {
        'confirm-approve-content--full': showFullTxDetails,
      })}>
        <div className="confirm-approve-content__identicon-wrapper">
          <Identicon
            className="confirm-approve-content__identicon"
            diameter={48}
            address={origin}
            image={siteImage}
          />
        </div>
        <div className="confirm-approve-content__title">
          { `Allow ${origin} to spend your ${tokenSymbol}?` }
        </div>
        <div className="confirm-approve-content__description">
          { `Do you trust this site? By granting this permission, you’re allowing ${origin} to withdraw your ${tokenSymbol} and automate transactions for you.` }
        </div>
        <div
          className="confirm-approve-content__edit-submission-button-container"
        >
          <div
            className="confirm-approve-content__medium-link-text cursor-pointer"
            onClick={() => showEditApprovalPermissionModal({ customTokenAmount, tokenAmount, tokenSymbol, setCustomAmount, tokenBalance })}
          >
            Edit permission
          </div>
        </div>
        <div className="confirm-approve-content__card-wrapper">
          {this.renderApproveContentCard({
            symbol: <i className="fa fa-tag" />,
            title: 'Transaction Fee',
            showEdit: true,
            onEditClick: showCustomizeGasModal,
            content: this.renderTransactionDetailsContent(),
            noBorder: !showFullTxDetails,
            footer: <div
              className="confirm-approve-content__view-full-tx-button-wrapper"
              onClick={() => this.setState({ showFullTxDetails: !this.state.showFullTxDetails })}
            >
              <div className="confirm-approve-content__view-full-tx-button cursor-pointer">
                <div className="confirm-approve-content__small-blue-text">
                  View full transaction details
                </div>
                <i className={classnames({
                  'fa fa-caret-up': showFullTxDetails,
                  'fa fa-caret-down': !showFullTxDetails,
                })} />
              </div>
            </div>,
          })}
        </div>

        {
          showFullTxDetails
            ? (
              <div className="confirm-approve-content__full-tx-content">
                <div className="confirm-approve-content__permission">
                  {this.renderApproveContentCard({
                    symbol: <img src="/images/user-check.svg" />,
                    title: 'Permission',
                    content: this.renderPermissionContent(),
                    showEdit: true,
                    onEditClick: () => showEditApprovalPermissionModal({
                      customTokenAmount,
                      tokenAmount,
                      tokenSymbol,
                      tokenBalance,
                      setCustomAmount,
                    }),
                  })}
                </div>
                <div className="confirm-approve-content__data">
                  {this.renderApproveContentCard({
                    symbol: <i className="fa fa-file" />,
                    title: 'Data',
                    content: this.renderDataContent(),
                    noBorder: true,
                  })}
                </div>
              </div>
            )
            : null
        }
      </div>
    )
  }
}
