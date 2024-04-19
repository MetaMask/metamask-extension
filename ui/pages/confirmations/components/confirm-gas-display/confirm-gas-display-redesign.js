import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { currentConfirmationSelector } from '../../selectors';
import { useSupportsEIP1559 } from '../confirm/hooks';
import GasDetailsItemRedesign from '../gas-details-item/gas-details-item-redesign';
import GasDetailsItem from '../gas-details-item';

const ConfirmGasDisplayRedesign = ({ userAcknowledgedGasMissing = false }) => {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { supportsEIP1559 } = useSupportsEIP1559(currentConfirmation);
  const dataTestId = 'confirm-gas-display';

  return supportsEIP1559 ? (
    <GasDetailsItemRedesign
      data-testid={dataTestId}
      userAcknowledgedGasMissing={userAcknowledgedGasMissing}
    />
  ) : // TODO: Legacy Gas Component using currentConfirmation
  null;
};

ConfirmGasDisplayRedesign.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
};

export default ConfirmGasDisplayRedesign;
