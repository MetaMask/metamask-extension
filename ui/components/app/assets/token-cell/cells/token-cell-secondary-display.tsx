import React, { CSSProperties } from 'react';
import { useSelector } from 'react-redux';
import { Skeleton } from '@metamask/design-system-react';
import {
  BackgroundColor,
  FontWeight,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  SensitiveText,
  SensitiveTextLength,
} from '../../../../component-library';
import {
  getUseCurrencyRateCheck,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../../selectors';
import { TokenFiatDisplayInfo } from '../../types';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { getProviderConfig } from '../../../../../../shared/lib/selectors/networks';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';
import { isZeroAmount } from '../../../../../helpers/utils/number-utils';

type TokenCellSecondaryDisplayProps = {
  token: TokenFiatDisplayInfo;
  handleScamWarningModal: (arg: boolean) => void;
  privacyMode: boolean;
};

const secondaryDisplayStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  paddingInlineStart: 8,
};

export const TokenCellSecondaryDisplay = React.memo(
  ({
    token,
    handleScamWarningModal,
    privacyMode,
  }: TokenCellSecondaryDisplayProps) => {
    const isEvm = isEvmChainId(token.chainId);
    const { type, rpcUrl } = useSelector(getProviderConfig);

    const isOriginalNativeToken = useIsOriginalNativeTokenSymbol(
      token.chainId,
      token.symbol,
      type,
      rpcUrl,
    );

    const showScamWarning = token.isNative && !isOriginalNativeToken && isEvm;

    const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

    const anyEnabledNetworksAreAvailable = useSelector(
      selectAnyEnabledNetworksAreAvailable,
    );

    const secondaryDisplayText = useCurrencyRateCheck
      ? token.secondary || '—'
      : '';

    // show scam warning
    if (showScamWarning) {
      return (
        <ButtonIcon
          iconName={IconName.Danger}
          onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            e.preventDefault();
            e.stopPropagation();
            handleScamWarningModal(true);
          }}
          color={IconColor.errorDefault}
          size={ButtonIconSize.Md}
          backgroundColor={BackgroundColor.transparent}
          data-testid="scam-warning"
          ariaLabel=""
        />
      );
    }

    // secondary display text
    return (
      <Skeleton
        hideChildren={
          !anyEnabledNetworksAreAvailable &&
          isZeroAmount(secondaryDisplayText) &&
          secondaryDisplayText !== '—'
        }
        className="mb-1"
      >
        <SensitiveText
          fontWeight={token.secondary ? FontWeight.Medium : FontWeight.Normal}
          variant={token.secondary ? TextVariant.bodyMd : TextVariant.bodySm}
          textAlign={TextAlign.End}
          data-testid="multichain-token-list-item-secondary-value"
          ellipsis={token.isStakeable}
          isHidden={privacyMode}
          length={SensitiveTextLength.Medium}
          style={secondaryDisplayStyle}
        >
          {secondaryDisplayText}
        </SensitiveText>
      </Skeleton>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.secondary === nextProps.token.secondary &&
    prevProps.privacyMode === nextProps.privacyMode,
);
