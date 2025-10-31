import React, { useState } from 'react';
import {
  Box,
  BoxBorderColor,
  Button,
  ButtonSize,
  ButtonVariant,
  TextButton,
} from '@metamask/design-system-react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapComparisonInfo } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo';

const DAPP_SWAP_COMPARISON_ORIGIN = 'https://app.uniswap.org';

const enum SwapType {
  Current = 'current',
  Metamask = 'metamask',
}

const enum SwapButtonType {
  Text = 'text',
  ButtonType = 'button',
}

const SwapButton = ({
  type,
  label,
  onClick,
}: {
  type: SwapButtonType;
  label: string;
  onClick: () => void;
}) => {
  if (type === SwapButtonType.ButtonType) {
    return (
      <Button
        className="dapp-swap_highlighted-button"
        size={ButtonSize.Md}
        variant={ButtonVariant.Secondary}
        onClick={onClick}
      >
        {label}
      </Button>
    );
  }
  return (
    <TextButton className="dapp-swap_text-button" onClick={onClick}>
      {label}
    </TextButton>
  );
};

const DappSwapComparisonInner = () => {
  const t = useI18nContext();
  const { selectedQuote } = useDappSwapComparisonInfo();
  const [selectedSwapType, setSelectedSwapType] = useState<SwapType>(
    SwapType.Current,
  );

  if (
    process.env.DAPP_SWAP_SHIELD_ENABLED?.toString() !== 'true' ||
    !selectedQuote
  ) {
    return null;
  }

  return (
    <Box
      borderColor={BoxBorderColor.BorderMuted}
      borderWidth={1}
      className="dapp-swap_wrapper"
      marginBottom={4}
      marginTop={2}
      padding={1}
    >
      <SwapButton
        type={
          selectedSwapType === SwapType.Current
            ? SwapButtonType.ButtonType
            : SwapButtonType.Text
        }
        onClick={() => setSelectedSwapType(SwapType.Current)}
        label={t('current')}
      />
      <SwapButton
        type={
          selectedSwapType === SwapType.Metamask
            ? SwapButtonType.ButtonType
            : SwapButtonType.Text
        }
        onClick={() => setSelectedSwapType(SwapType.Metamask)}
        label={t('saveAndEarn')}
      />
    </Box>
  );
};

export const DappSwapComparisonBanner = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { dappSwapMetrics } = useSelector(getRemoteFeatureFlags);

  const dappSwapMetricsEnabled =
    (dappSwapMetrics as { enabled: boolean })?.enabled === true &&
    transactionMeta.origin === DAPP_SWAP_COMPARISON_ORIGIN;

  if (!dappSwapMetricsEnabled) {
    return null;
  }

  return <DappSwapComparisonInner />;
};
