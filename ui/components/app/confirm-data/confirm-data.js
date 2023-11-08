import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  Color,
  TextVariant,
  TextTransform,
} from '../../../helpers/constants/design-system';
import { getKnownMethodData } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionFunctionType } from '../../../hooks/useTransactionFunctionType';

import Disclosure from '../../ui/disclosure';
import TransactionDecoding from '../transaction-decoding';
import { Text, Box } from '../../component-library';
import TransactionInsightsDeprecationAlert from './transaction-insights-deprecation-alert';

const ConfirmData = ({ txData, dataComponent }) => {
  const t = useI18nContext();
  const { txParams = {} } = txData;
  const methodData = useSelector(
    (state) => getKnownMethodData(state, txParams.data) || {},
  );
  const { functionType } = useTransactionFunctionType(txData);

  if (dataComponent) {
    return (
      <Box>
        <Box marginLeft={4} marginRight={4} marginTop={4}>
          <TransactionInsightsDeprecationAlert />
        </Box>
        {dataComponent}
      </Box>
    );
  }

  if (!txParams.data) {
    return null;
  }

  const { params } = methodData;
  const functionParams = params?.length
    ? `(${params.map(({ type }) => type).join(', ')})`
    : '';

  return (
    <Box>
      <Box marginLeft={4} marginRight={4} marginTop={4}>
        <TransactionInsightsDeprecationAlert />
      </Box>
      <Box color={Color.textAlternative} className="confirm-data" padding={4}>
        <Box paddingBottom={3} paddingTop={2}>
          <Text
            as="span"
            textTransform={TextTransform.Uppercase}
            variant={TextVariant.bodySm}
          >
            {`${t('functionType')}:`}
          </Text>
          <Text
            as="span"
            color={Color.textDefault}
            paddingLeft={1}
            textTransform={TextTransform.Capitalize}
            variant={TextVariant.bodySmBold}
          >
            {`${functionType} ${functionParams}`}
          </Text>
        </Box>
        <Disclosure>
          <TransactionDecoding to={txParams?.to} inputData={txParams?.data} />
        </Disclosure>
      </Box>
    </Box>
  );
};

ConfirmData.propTypes = {
  txData: PropTypes.object,
  dataComponent: PropTypes.element,
};

export default ConfirmData;
