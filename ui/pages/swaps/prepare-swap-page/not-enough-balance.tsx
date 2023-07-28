import React from 'react';
import PropTypes from 'prop-types';

import {
  SEVERITIES,
  TextVariant,
  Size,
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
    <BannerAlert severity={SEVERITIES.INFO} title={title} className="">
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
            className=""
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
