import React from 'react';
import PropTypes from 'prop-types';

import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import Box from '../../../ui/box/box';
import Typography from '../../../ui/typography/typography';
import {
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  COLORS,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionInsightSnap } from '../../../../hooks/flask/useTransactionInsightSnap';

export const SnapInsight = ({ transaction, snapId }) => {
  const transactionInsight = useTransactionInsightSnap(transaction, snapId);

  const insights = transactionInsight?.insights;

  console.log(snapId);
  console.log(response);

  const t = useI18nContext();

  if (response && Object.keys(response).length !== 0) {
    return (
      <Box
        paddingLeft={6}
        paddingRight={6}
        paddingBottom={3}
        style={{ overflowY: 'auto', height: '170px' }}
      >
        {Object.keys(response).map((key, i) => (
          <Box key={i} paddingTop={3}>
            <Typography fontWeight="bold">{key}</Typography>
            <p>{response[key]}</p>
          </Box>
        ))}
      </Box>
    );
  } else if (response && Object.keys(response).length === 0) {
    return (
      <Box
        flexDirection={FLEX_DIRECTION.COLUMN}
        marginTop={12}
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
      >
        <Preloader size={40} />
        <Typography marginTop={3} color={COLORS.TEXT_ALTERNATIVE}>
          {t('snapsInsightLoading')}
        </Typography>
      </Box>
    );
  }
  return (
    <Box
      display="flex"
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      marginTop={12}
    >
      <Typography color={COLORS.TEXT_ALTERNATIVE}>
        {t('snapsNoInsight')}
      </Typography>
    </Box>
  );
};

SnapInsight.propTypes = {
  transaction: PropTypes.object,
  snapId: PropTypes.string,
};
