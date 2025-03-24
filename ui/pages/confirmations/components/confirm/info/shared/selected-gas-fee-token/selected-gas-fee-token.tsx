import React, { useCallback, useState } from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
} from '../../../../../../../helpers/constants/design-system';
import Identicon from '../../../../../../../components/ui/identicon';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../../context/confirm';
import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../../../../../../../../shared/modules/selectors/networks';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../../../../shared/constants/network';
import { GasFeeTokenModal } from '../gas-fee-token-modal';

export function SelectedGasFeeToken() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, gasFeeTokens, selectedGasFeeToken } = currentConfirmation;
  const hasGasFeeTokens = Boolean(gasFeeTokens?.length);

  const networkConfiguration = useSelector(getNetworkConfigurationsByChainId)?.[
    chainId
  ];

  const handleClick = useCallback(() => {
    if (!hasGasFeeTokens) {
      return;
    }

    setIsModalOpen(true);
  }, [hasGasFeeTokens]);

  const nativeTicker = networkConfiguration?.nativeCurrency;

  const gasFeeToken = gasFeeTokens?.find(
    (token) =>
      token.tokenAddress?.toLowerCase() === selectedGasFeeToken?.toLowerCase(),
  );

  const symbol = gasFeeToken?.symbol ?? nativeTicker;

  return (
    <>
      {isModalOpen && (
        <GasFeeTokenModal onClose={() => setIsModalOpen(false)} />
      )}
      <Box
        onClick={handleClick}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderRadius={BorderRadius.pill}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        paddingInline={2}
        gap={1}
        style={{
          cursor: hasGasFeeTokens ? 'pointer' : 'default',
        }}
      >
        {!gasFeeToken && (
          <NativeIcon chainId={chainId} nativeSymbol={nativeTicker} />
        )}
        {gasFeeToken && (
          <Identicon address={gasFeeToken.tokenAddress} diameter={12} />
        )}
        <Text>{symbol}</Text>
        {hasGasFeeTokens && (
          <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
        )}
      </Box>
    </>
  );
}

function NativeIcon({
  chainId,
  nativeSymbol,
}: {
  chainId: Hex;
  nativeSymbol: string;
}) {
  const source =
    CHAIN_ID_TOKEN_IMAGE_MAP[chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP];

  return (
    <AvatarToken
      src={source}
      name={nativeSymbol}
      size={AvatarTokenSize.Xs}
      backgroundColor={BackgroundColor.backgroundDefault}
    />
  );
}
