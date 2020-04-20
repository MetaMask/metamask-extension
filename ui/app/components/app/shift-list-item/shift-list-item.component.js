import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { createExplorerLink as explorerLink } from '@metamask/etherscan-link'
import { formatDate, addressSummary } from '../../../helpers/utils/util'
import CopyButton from '../../ui/copyButton'
import EthBalance from '../../ui/eth-balance'

export default class ShiftListItem extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    conversionRate: undefined,
    currentCurrency: undefined,
  }

  static propTypes = {
    depositType: PropTypes.string.isRequired,
    depositAddress: PropTypes.string.isRequired,
    conversionRate: PropTypes.any,
    currentCurrency: PropTypes.any,
    time: PropTypes.string.isRequired,
    response: PropTypes.shape({
      outgoingCoin: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      transaction: PropTypes.string.isRequired,
    }),
  }

  renderUtilComponents () {
    const { conversionRate, currentCurrency } = this.props

    switch (this.props.response.status) {
      case 'no_deposits':
        return (
          <div className="flex-row">
            <CopyButton value={this.props.depositAddress} />
          </div>
        )

      case 'received':
        return <div className="flex-row" />

      case 'complete':
        return (
          <div className="flex-row">
            <CopyButton value={this.props.response.transaction} />
            <EthBalance
              value={`${this.props.response.outgoingCoin}`}
              conversionRate={conversionRate}
              currentCurrency={currentCurrency}
              width="55px"
              shorten
              needsParse={false}
              incoming
              style={{
                fontSize: '15px',
                color: '#01888C',
              }}
            />
          </div>
        )

      case 'failed':
        return ''

      default:
        return ''
    }
  }

  renderInfo () {
    switch (this.props.response.status) {
      case 'no_deposits':
        return (
          <div
            className="flex-column"
            style={{
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 'x-small',
                color: '#ABA9AA',
                width: '100%',
              }}
            >
              {this.context.t('toETHviaShapeShift', [this.props.depositType])}
            </div>
            <div>
              {this.context.t('noDeposits')}
            </div>
            <div
              style={{
                fontSize: 'x-small',
                color: '#ABA9AA',
                width: '100%',
              }}
            >
              {formatDate(this.props.time)}
            </div>
          </div>
        )

      case 'received':
        return (
          <div
            className="flex-column"
            style={{
              width: '200px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 'x-small',
                color: '#ABA9AA',
                width: '100%',
              }}
            >
              {this.context.t('toETHviaShapeShift', [this.props.depositType])}
            </div>
            <div>
              {this.context.t('conversionProgress')}
            </div>
            <div
              style={{
                fontSize: 'x-small',
                color: '#ABA9AA',
                width: '100%',
              }}
            >
              {formatDate(this.props.time)}
            </div>
          </div>
        )

      case 'complete':
        const url = explorerLink(this.props.response.transaction, parseInt('1'))
        return (
          <div
            className="flex-column pointer"
            style={{
              width: '200px',
              overflow: 'hidden',
            }}
            onClick={() => global.platform.openTab({ url })}
          >
            <div
              style={{
                fontSize: 'x-small',
                color: '#ABA9AA',
                width: '100%',
              }}
            >
              {this.context.t('fromShapeShift')}
            </div>
            <div>
              {formatDate(this.props.time)}
            </div>
            <div
              style={{
                fontSize: 'x-small',
                color: '#ABA9AA',
                width: '100%',
              }}
            >
              {addressSummary(this.props.response.transaction)}
            </div>
          </div>
        )

      case 'failed':
        return (
          <span className="error">
            {`(${this.context.t('failed')})`}
          </span>
        )

      default:
        return ''
    }
  }

  render () {
    return (
      <div
        className="transaction-list-item tx-list-clickable"
        style={{
          paddingTop: '20px',
          paddingBottom: '20px',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            width: '0px',
            position: 'relative',
            bottom: '19px',
          }}
        >
          <img
            src="https://shapeshift.io/logo.png"
            alt=""
            style={{
              height: '35px',
              width: '132px',
              position: 'absolute',
              clip: 'rect(0px,30px,34px,0px)',
            }}
          />
        </div>
        {this.renderInfo()}
        {this.renderUtilComponents()}
      </div>
    )
  }
}
