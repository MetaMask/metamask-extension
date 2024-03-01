import React, { useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { captureException } from '@sentry/browser';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import fetchEstimatedL1Fee from '../../../../helpers/utils/optimism/fetchEstimatedL1Fee';
import { SECONDARY } from '../../../../helpers/constants/common';
import { I18nContext } from '../../../../contexts/i18n';
import { sumHexes } from '../../../../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../../../../shared/constants/common';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { getUseCurrencyRateCheck } from '../../../../selectors';

export default function MultilayerFeeMessage({
  transaction,
  layer2fee,
  nativeCurrency,
  plainStyle,
}) {
  const t = useContext(I18nContext);
  const [fetchedLayer1Total, setLayer1Total] = useState(null);

  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  useEffect(() => {
    if (!transaction?.txParams) {
      return;
    }
    const getEstimatedL1Fee = async () => {
      try {
        const result = await fetchEstimatedL1Fee(
          transaction?.chainId,
          transaction,
        );
        setLayer1Total(result);
      } catch (e) {
        captureException(e);
        setLayer1Total(null);
      }
    };
    getEstimatedL1Fee();
  }, [transaction]);

  if (!transaction?.txParams) {
    return null;
  }

  let layer1Total = t('unknown');
  let feeTotalInFiat = t('unknown');

  if (fetchedLayer1Total !== null) {
    const layer1TotalBN = new Numeric(
      fetchedLayer1Total,
      16,
      EtherDenomination.WEI,
    );
    layer1Total = `${layer1TotalBN
      .toDenomination(EtherDenomination.ETH)
      .toFixed(12)} ${nativeCurrency}`;

    feeTotalInFiat = useCurrencyRateCheck ? (
      <UserPreferencedCurrencyDisplay
        type={SECONDARY}
        value={fetchedLayer1Total}
        showFiat
        hideLabel
      />
    ) : null;
  }

  const totalInWeiHex = sumHexes(
    layer2fee || '0x0',
    fetchedLayer1Total || '0x0',
    transaction?.txParams?.value || '0x0',
  );

  const totalBN = new Numeric(totalInWeiHex, 16, EtherDenomination.WEI);
  const totalInEth = `${totalBN
    .toDenomination(EtherDenomination.ETH)
    .toFixed(12)} ${nativeCurrency}`;

  const totalInFiat = useCurrencyRateCheck ? (
    <UserPreferencedCurrencyDisplay
      type={SECONDARY}
      value={totalInWeiHex}
      showFiat
      hideLabel
    />
  ) : null;

  return (
    <div className="multi-layer-fee-message">
      <TransactionDetailItem
        key="multi-layer-fee-message-total-item-gas-fee"
        detailTitle={t('layer1Fees')}
        detailTotal={layer1Total}
        detailText={useCurrencyRateCheck && feeTotalInFiat}
        noBold={plainStyle}
        flexWidthValues={plainStyle}
      />
      <TransactionDetailItem
        key="multi-layer-fee-message-total-item-total"
        detailTitle={t('total')}
        detailTotal={totalInEth}
        detailText={totalInFiat}
        subTitle={t('transactionDetailMultiLayerTotalSubtitle')}
        noBold={plainStyle}
        flexWidthValues={plainStyle}
      />
    </div>
  );
}

MultilayerFeeMessage.propTypes = {
  transaction: PropTypes.object,
  layer2fee: PropTypes.string,
  nativeCurrency: PropTypes.string,
  plainStyle: PropTypes.bool,
};
