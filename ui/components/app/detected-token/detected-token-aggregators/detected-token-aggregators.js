import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../hooks/useI18nContext';

import Box from '../../../ui/box';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography/typography';
import {
  DISPLAY,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';

const NUMBER_OF_AGGREGATORS_TO_DISPLAY = 2;

const DetectedTokenAggregators = ({ aggregators }) => {
  const t = useI18nContext();
  const numOfHiddenAggregators =
    parseInt(aggregators.length, 10) - NUMBER_OF_AGGREGATORS_TO_DISPLAY;
  const [displayMore, setDisplayMore] = useState(false);

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-aggregators">
      <Typography variant={TYPOGRAPHY.H7} fontWeight={FONT_WEIGHT.NORMAL}>
        {t('fromTokenLists', [
          numOfHiddenAggregators > 0 && !displayMore ? (
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.NORMAL}
              key="detected-token-aggrgators-with-more"
            >
              {`${aggregators
                .slice(0, NUMBER_OF_AGGREGATORS_TO_DISPLAY)
                .join(', ')}`}
              <Button
                type="link"
                className="detected-token-aggregators__link"
                onClick={() => setDisplayMore(true)}
                key="detected-token-aggrgators-link"
              >
                {t('plusXMore', [numOfHiddenAggregators])}
              </Button>
            </Typography>
          ) : (
            <Typography
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.NORMAL}
              key="detected-token-aggrgators-without-more"
            >
              {`${aggregators.join(', ')}.`}
            </Typography>
          ),
        ])}
      </Typography>
    </Box>
  );
};

DetectedTokenAggregators.propTypes = {
  aggregators: PropTypes.array.isRequired,
};

export default DetectedTokenAggregators;
