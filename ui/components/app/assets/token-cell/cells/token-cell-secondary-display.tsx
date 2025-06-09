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
import { getCurrencyRates } from '../../../../../selectors';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { TokenFiatDisplayInfo } from '../../types';

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
    const currencyRates = useSelector(getCurrencyRates);

    const isOriginalTokenSymbol = token.symbol && currencyRates[token.symbol];

    const showScamWarning = token.isNative && !isOriginalTokenSymbol && isEvm;

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
