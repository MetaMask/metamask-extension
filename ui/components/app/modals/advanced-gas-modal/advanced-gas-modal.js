import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { GAS_ESTIMATE_TYPES } from '../../../../helpers/constants/common';
import Modal from '../../modal';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import FormField from '../../../ui/form-field';
import Box from '../../../ui/box';
import { hideModal } from '../../../../store/actions';

const AdvancedGasModal = () => {
  console.log('in AdvancedGasModal');
  const dispatch = useDispatch();
  // const {
  //     maxPriorityFeePerGas,
  //     setMaxPriorityFeePerGas,
  //     maxFeePerGas,
  //     setMaxFeePerGas,
  //     // estimatedBaseFee,
  //   } = useGasFeeContext();
  const [maxFeePerGas, setMaxFeePerGas] = useState(0);
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(0);
  console.log(maxFeePerGas, maxPriorityFeePerGas);
  return (
    <Modal
      headerText="Advanced gas fee"
      // onClose={() => dispatch(hideModal())}
    >
      <Box>
        <FormField
          onChange={(value) => setMaxFeePerGas(value)}
          titleText="Max Base Fee"
          titleUnit="(Multiplier)"
          value={maxFeePerGas}
          detailText="192 GWEI ≈ $19.81"
          numeric
        />
        <FormField
          onChange={(value) => setMaxPriorityFeePerGas(value)}
          titleText="Priority Fee"
          titleUnit="(GWEI)"
          value={maxPriorityFeePerGas}
          detailText="≈ $0.31"
          numeric
        />
      </Box>
    </Modal>
  );
};

AdvancedGasModal.propTypes = {
  gasEstimateType: PropTypes.oneOf(Object.values(GAS_ESTIMATE_TYPES)),
  setMaxPriorityFee: PropTypes.func,
  setMaxFee: PropTypes.func,
  maxPriorityFee: PropTypes.number,
  maxFee: PropTypes.number,
  onManualChange: PropTypes.func,
  gasLimit: PropTypes.number,
  setGasLimit: PropTypes.func,
  gasPrice: PropTypes.number,
  setGasPrice: PropTypes.func,
  maxPriorityFeeFiat: PropTypes.string,
  maxFeeFiat: PropTypes.string,
  gasErrors: PropTypes.object,
  minimumGasLimit: PropTypes.string,
  supportsEIP1559: PropTypes.bool,
};

export default withModalProps(AdvancedGasModal);
