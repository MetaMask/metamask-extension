import { TransactionMeta } from '@metamask/transaction-controller';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { BigNumber } from 'bignumber.js';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  TEST_CHAINS,
} from '../../../../../../../../shared/constants/network';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import { getNetworkConfigurationsByChainId } from '../../../../../../../../shared/modules/selectors/networks';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
import {
  getPreferences,
  selectConversionRateByChainId,
} from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';
import { formatAmount } from '../../../../simulation-details/formatAmount';
import { useSendingValueMetric } from '../../hooks/useSendingValueMetric';
import SendHeadingLayout from '../send-heading-layout/send-heading-layout';

const NativeSendHeading = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;

  const nativeAssetTransferValue = calcTokenAmount(
    transactionMeta.txParams.value as string,
    18,
  );

  const conversionRate = useSelector((state) =>
    selectConversionRateByChainId(state, chainId),
  );

  const fiatValue =
    conversionRate &&
    nativeAssetTransferValue &&
    new BigNumber(conversionRate)
      .times(nativeAssetTransferValue, 10)
      .toNumber();
  const fiatFormatter = useFiatFormatter();
  const isNonZeroSmallValue =
    fiatValue &&
    new BigNumber(String(fiatValue)).lt(new BigNumber(0.01)) &&
    new BigNumber(String(fiatValue)).greaterThan(new BigNumber(0));
  const fiatDisplayValue = isNonZeroSmallValue
    ? `< ${fiatFormatter(0.01, { shorten: true })}`
    : fiatValue && fiatFormatter(fiatValue, { shorten: true });

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const network = networkConfigurationsByChainId?.[transactionMeta.chainId];
  const { nativeCurrency } = network;

  const locale = useSelector(getIntlLocale);
  const roundedTransferValue = formatAmount(locale, nativeAssetTransferValue);

  const transferValue = nativeAssetTransferValue.toFixed();

  type TestNetChainId = (typeof TEST_CHAINS)[number];
  const isTestnet = TEST_CHAINS.includes(
    transactionMeta.chainId as TestNetChainId,
  );
  const { showFiatInTestnets } = useSelector(getPreferences);

  const NetworkImage = (
    <AvatarToken
      src={
        CHAIN_ID_TOKEN_IMAGE_MAP[
          transactionMeta.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
        ]
      }
      name={nativeCurrency}
      size={AvatarTokenSize.Xl}
    />
  );

  const NativeAssetAmount =
    roundedTransferValue === transferValue ? (
      <Box paddingBottom={1}>
        <Text variant={TextVariant.HeadingLg} color={TextColor.Inherit}>
          {`${roundedTransferValue} ${nativeCurrency}`}
        </Text>
      </Box>
    ) : (
      <Tooltip title={transferValue} position="right">
        <Box paddingBottom={1}>
          <Text variant={TextVariant.HeadingLg} color={TextColor.Inherit}>
            {`${roundedTransferValue} ${nativeCurrency}`}
          </Text>
        </Box>
      </Tooltip>
    );

  const NativeAssetFiatConversion = Boolean(fiatDisplayValue) &&
    (!isTestnet || showFiatInTestnets) && (
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {fiatDisplayValue}
      </Text>
    );

  useSendingValueMetric({ transactionMeta, fiatValue });

  return (
    <SendHeadingLayout image={NetworkImage}>
      {NativeAssetAmount}
      {NativeAssetFiatConversion}
    </SendHeadingLayout>
  );
};

export default NativeSendHeading;
