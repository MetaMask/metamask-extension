import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import AddTokenButton from '../add-token-button'
import TokenList from '../token-list'
import { ADD_TOKEN_ROUTE } from '../../../helpers/constants/routes'
import AssetListItem from '../asset-list-item'
import { useMetricEvent } from '../../../hooks/useMetricEvent'
import { useUserPreferencedCurrencyDisplays } from '../../../hooks/useUserPreferencedCurrencyDisplays'
import { getCurrentAccountWithSendEtherInfo, getNativeCurrency, getShouldShowFiat } from '../../../selectors'

const AssetList = ({ onClickAsset }) => {
  const history = useHistory()
  const selectedAccountBalance = useSelector((state) => getCurrentAccountWithSendEtherInfo(state).balance)
  const nativeCurrency = useSelector(getNativeCurrency)
  const showFiat = useSelector(getShouldShowFiat)
  const selectTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Token Menu',
      name: 'Clicked Token',
    },
  })
  const addTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Token Menu',
      name: 'Clicked "Add Token"',
    },
  })

  const { primaryCurrencyDisplay, secondaryCurrencyDisplay } = useUserPreferencedCurrencyDisplays(selectedAccountBalance, {
    primaryPreferenceOpts: { ethNumberOfDecimals: 4 },
    secondaryPreferenceOpts: { ethNumberOfDecimals: 4 },
  })

  return (
    <>
      <AssetListItem
        onClick={() => onClickAsset(nativeCurrency)}
        data-testid="wallet-balance"
        primary={primaryCurrencyDisplay}
        secondary={showFiat ? secondaryCurrencyDisplay : undefined}
      />
      <TokenList
        onTokenClick={(tokenAddress) => {
          onClickAsset(tokenAddress)
          selectTokenEvent()
        }}
      />
      <AddTokenButton
        onClick={() => {
          history.push(ADD_TOKEN_ROUTE)
          addTokenEvent()
        }}
      />
    </>
  )
}

AssetList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
}

export default AssetList
