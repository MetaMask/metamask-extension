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
import { useI18nContext } from 'ui/hooks/useI18nContext';

export const SnapInsight = ({ transaction, snapId }) => {
  const insight = {
    test: 'An Insight',
    test1: 'An Insight',
    test2: 'An Insight',
    test3: 'An Insight',
    test4: 'An Insight',
    test5: 'An Insight',
    test6: 'An Insight',
    test7: 'An Insight',
    test8: 'An Insight',
    test9: 'An Insight',
    test10: 'An Insight',
    test11: 'An Insight',
    test12: 'An Insight',
    test13: 'An Insight',
    test14: 'An Insight',
  }; /* useInsightSnap(transaction, snapId); */

  const t = useI18nContext();

  if (insight && Object.keys(insight).length !== 0) {
    return (
      <Box
        paddingLeft={6}
        paddingRight={6}
        paddingBottom={3}
        style={{ overflowY: 'auto', height: '170px' }}
      >
        {Object.keys(insight).map((key, i) => (
          <Box key={i} paddingTop={3}>
            <Typography fontWeight="bold">{key}</Typography>
            <p>{insight[key]}</p>
          </Box>
        ))}
      </Box>
    );
  } else if (insight && Object.keys(insight).length === 0) {
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
