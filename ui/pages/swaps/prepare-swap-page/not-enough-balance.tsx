import React from 'react';
import PropTypes from 'prop-types';

import {
  TextVariant,
  Size,
  Severity,
} from '../../../helpers/constants/design-system';
import {
  BannerAlert,
  ButtonLink,
  Text,
} from '../../../components/component-library';

interface Props {
  title: string;
  actionableBalanceErrorMessage: string;
  needsMoreGas: boolean;
  openBuyCryptoInPdapp: () => void;
  needsMoreGasText: string;
}

export default function NotEnoughBalance({
  title,
  actionableBalanceErrorMessage,
  needsMoreGas,
  openBuyCryptoInPdapp,
  needsMoreGasText,
}: Props) {
  return (
    <BannerAlert
      severity={Severity.Info}
      title={title}
      className="not-enough-balance__banner"
    >
      <Text
        variant={TextVariant.bodyMd}
        as="h6"
        data-testid="mm-banner-alert-notification-text"
      >
        {actionableBalanceErrorMessage}

        {needsMoreGas && (
          <ButtonLink
            onClick={() => openBuyCryptoInPdapp()}
            size={Size.inherit}
            className="not-enough-balance__button"
            danger={false}
            disabled={false}
          >
            {needsMoreGasText}
          </ButtonLink>
        )}
      </Text>
    </BannerAlert>
  );
}

NotEnoughBalance.propTypes = {
  title: PropTypes.string.isRequired,
  actionableBalanceErrorMessage: PropTypes.string.isRequired,
  needsMoreGas: PropTypes.bool.isRequired,
  openBuyCryptoInPdapp: PropTypes.func.isRequired,
  needsMoreGasText: PropTypes.string.isRequired,
};
