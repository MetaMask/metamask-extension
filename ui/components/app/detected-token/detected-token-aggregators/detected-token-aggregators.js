import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../contexts/i18n';

import Box from '../../../ui/box';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography/typography';
import {
  DISPLAY,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';

const DetectedTokenAggregators = ({ aggregatorsList }) => {
  const t = useContext(I18nContext);
  const numOfHiddenAggregators = parseInt(aggregatorsList.length, 10) - 2;
  const [displayMore, setDisplayMore] = useState(false);

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-aggregators">
      <Typography variant={TYPOGRAPHY.H7} fontWeight={FONT_WEIGHT.NORMAL}>
        {t('fromTokenLists', [
          numOfHiddenAggregators > 0 && !displayMore ? (
            <Typography variant={TYPOGRAPHY.H7} fontWeight={FONT_WEIGHT.NORMAL}>
              {`${aggregatorsList.slice(0, 2).join(', ')}`}
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
            <Typography variant={TYPOGRAPHY.H7} fontWeight={FONT_WEIGHT.NORMAL}>
              {`${aggregatorsList.join(', ')}.`}
            </Typography>
          ),
        ])}
      </Typography>
    </Box>
  );
};

DetectedTokenAggregators.propTypes = {
  aggregatorsList: PropTypes.array.isRequired,
};

export default DetectedTokenAggregators;
