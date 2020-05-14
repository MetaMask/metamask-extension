import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import AddTokenButton from '../add-token-button'
import TokenList from '../token-list'
import { ADD_TOKEN_ROUTE } from '../../../helpers/constants/routes'
import AssetListItem from '../asset-list-item'
import CurrencyDisplay from '../../ui/currency-display'
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common'
import { useMetricEvent } from '../../../hooks/useMetricEvent'
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency'
import { getCurrentAccountWithSendEtherInfo, getShouldShowFiat } from '../../../selectors/selectors'
import { setSelectedToken } from '../../../store/actions'

const AssetList = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const selectedAccountBalance = useSelector((state) => getCurrentAccountWithSendEtherInfo(state).balance)
  const selectedTokenAddress = useSelector((state) => state.metamask.selectedTokenAddress)
  const showFiat = useSelector(getShouldShowFiat)
  const metricsEvent = useMetricEvent()

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 })
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 })

  return (
    <>
      <AssetListItem
        active={!selectedTokenAddress}
        onClick={() => dispatch(setSelectedToken())}
        data-testid="wallet-balance"
      >
        <CurrencyDisplay
          className="asset-list__primary-amount"
          currency={primaryCurrency}
          numberOfDecimals={primaryNumberOfDecimals}
          value={selectedAccountBalance}
        />
        {
          showFiat && (
            <CurrencyDisplay
              className="asset-list__secondary-amount"
              currency={secondaryCurrency}
              numberOfDecimals={secondaryNumberOfDecimals}
              value={selectedAccountBalance}
            />
          )
        }
      </AssetListItem>
      <TokenList
        onTokenClick={(tokenAddress) => {
          dispatch(setSelectedToken(tokenAddress))
          metricsEvent({
            eventOpts: {
              category: 'Navigation',
              action: 'Token Menu',
              name: 'Clicked Token',
            },
          })
        }}
      />
      <AddTokenButton
        onClick={() => {
          history.push(ADD_TOKEN_ROUTE)
          metricsEvent({
            eventOpts: {
              category: 'Navigation',
              action: 'Token Menu',
              name: 'Clicked "Add Token"',
            },
          })
        }}
      />
    </>
  )
}

export default AssetList
