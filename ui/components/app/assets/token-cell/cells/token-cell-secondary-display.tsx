import React from 'react';
import { useSelector } from 'react-redux';
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
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { TokenFiatDisplayInfo } from '../../types';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import { getProviderConfig } from '../../../../../../shared/modules/selectors/networks';

type TokenCellSecondaryDisplayProps = {
  token: TokenFiatDisplayInfo;
  handleScamWarningModal: (arg: boolean) => void;
  privacyMode: boolean;
};

export const TokenCellSecondaryDisplay = React.memo(
  ({
    token,
    handleScamWarningModal,
    privacyMode,
  }: TokenCellSecondaryDisplayProps) => {
    const isEvm = useSelector(getMultichainIsEvm);
    const test = useSelector(getProviderConfig);
    const { ticker, type, rpcUrl } = useSelector(getProviderConfig);

    const isOriginalNativeToken = useIsOriginalNativeTokenSymbol(
      token.chainId,
      ticker,
      type,
      rpcUrl,
    );

    const showScamWarning = token.isNative && !isOriginalNativeToken && isEvm;

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
      <SensitiveText
        fontWeight={FontWeight.Medium}
        variant={TextVariant.bodyMd}
        textAlign={TextAlign.End}
        data-testid="multichain-token-list-item-secondary-value"
        ellipsis={token.isStakeable}
        isHidden={privacyMode}
        length={SensitiveTextLength.Medium}
      >
        {token.secondary}
      </SensitiveText>
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.secondary === nextProps.token.secondary &&
    prevProps.privacyMode === nextProps.privacyMode,
);
