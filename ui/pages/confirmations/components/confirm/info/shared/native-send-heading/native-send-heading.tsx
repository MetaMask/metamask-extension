import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../../../../../shared/constants/network';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { MIN_AMOUNT } from '../../../../../../../hooks/useCurrencyDisplay';
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
import {
  getPreferences,
  selectConversionRateByChainId,
} from '../../../../../../../selectors';
import { getMultichainNetwork } from '../../../../../../../selectors/multichain';
import { useConfirmContext } from '../../../../../context/confirm';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../simulation-details/formatAmount';
import { toNonScientificString } from '../../hooks/use-token-values';

const NativeSendHeading = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;

  const nativeAssetTransferValue = new BigNumber(
    transactionMeta.txParams.value as string,
  ).dividedBy(new BigNumber(10).pow(18));

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
  const fiatDisplayValue =
    fiatValue && fiatFormatter(fiatValue, { shorten: true });

  const multichainNetwork = useSelector(getMultichainNetwork);
  const ticker = multichainNetwork?.network?.ticker;

  const locale = useSelector(getIntlLocale);
  const roundedTransferValue = formatAmount(locale, nativeAssetTransferValue);

  const transferValue = toNonScientificString(
    nativeAssetTransferValue.toNumber(),
  );

  type TestNetChainId = (typeof TEST_CHAINS)[number];
  const isTestnet = TEST_CHAINS.includes(
    transactionMeta.chainId as TestNetChainId,
  );
  const { showFiatInTestnets } = useSelector(getPreferences);

  const NetworkImage = (
    <AvatarToken
      src={
        multichainNetwork?.network?.rpcPrefs?.imageUrl ||
        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
          transactionMeta.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
        ]
      }
      name={multichainNetwork?.nickname}
      size={AvatarTokenSize.Xl}
    />
  );

  const NativeAssetAmount =
    roundedTransferValue ===
    `<${formatAmountMaxPrecision(locale, MIN_AMOUNT)}` ? (
      <Tooltip title={transferValue} position="right">
        <Text
          variant={TextVariant.headingLg}
          color={TextColor.inherit}
          marginTop={3}
        >
          {`${roundedTransferValue} ${ticker}`}
        </Text>
      </Tooltip>
    ) : (
      <Text
        variant={TextVariant.headingLg}
        color={TextColor.inherit}
        marginTop={3}
      >
        {`${roundedTransferValue} ${ticker}`}
      </Text>
    );

  const NativeAssetFiatConversion = Boolean(fiatDisplayValue) &&
    (!isTestnet || showFiatInTestnets) && (
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {fiatDisplayValue}
      </Text>
    );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={4}
    >
      {NetworkImage}
      {NativeAssetAmount}
      {NativeAssetFiatConversion}
    </Box>
  );
};

export default NativeSendHeading;
