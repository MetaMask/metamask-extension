import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { captureException } from '@sentry/browser';
import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import fetchEstimatedL1Fee from '../../../helpers/utils/optimism/fetchEstimatedL1Fee';
import { SECONDARY } from '../../../helpers/constants/common';
import { I18nContext } from '../../../contexts/i18n';
import { sumHexes } from '../../../helpers/utils/transactions.util';
import {
  toBigNumber,
  toNormalizedDenomination,
} from '../../../../shared/modules/conversion.utils';

export default function MultilayerFeeMessage({
  transaction,
  layer2fee,
  nativeCurrency,
  plainStyle,
}) {
  const t = useContext(I18nContext);

  const [fetchedLayer1Total, setLayer1Total] = useState(null);

  let layer1Total = 'unknown';
  let layer1TotalBN;

  if (fetchedLayer1Total !== null) {
    layer1TotalBN = toBigNumber.hex(fetchedLayer1Total);
    layer1Total = `${toNormalizedDenomination
      .WEI(layer1TotalBN)
      .toFixed(12)} ${nativeCurrency}`;
  }

  const feeTotal = sumHexes(layer2fee || '0x0', fetchedLayer1Total || '0x0');

  const totalInWeiHex = sumHexes(
    feeTotal || '0x0',
    transaction.txParams.value || '0x0',
  );

  const totalBN = toBigNumber.hex(totalInWeiHex);
  const totalInEth = `${toNormalizedDenomination
    .WEI(totalBN)
    .toFixed(12)} ${nativeCurrency}`;

  useEffect(() => {
    const getEstimatedL1Fee = async () => {
      try {
        const result = await fetchEstimatedL1Fee(global.eth, transaction);
        setLayer1Total(result);
      } catch (e) {
        captureException(e);
        setLayer1Total(null);
      }
    };
    getEstimatedL1Fee();
  }, [transaction]);

  const feeTotalInFiat = (
    <UserPreferencedCurrencyDisplay
      type={SECONDARY}
      value={feeTotal}
      showFiat
      hideLabel
    />
  );

  const totalInFiat = (
    <UserPreferencedCurrencyDisplay
      type={SECONDARY}
      value={totalInWeiHex}
      showFiat
      hideLabel
    />
  );

  return (
    <div className="multi-layer-fee-message">
      <TransactionDetailItem
        key="total-item"
        detailTitle={t('gasFee')}
        detailTotal={layer1Total}
        detailText={feeTotalInFiat}
        noBold={plainStyle}
        flexWidthValues={plainStyle}
      />
      <TransactionDetailItem
        key="total-item"
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
