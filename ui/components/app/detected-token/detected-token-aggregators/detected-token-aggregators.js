import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../../hooks/useI18nContext';

import Box from '../../../ui/box';
import Button from '../../../ui/button';
import {
  DISPLAY,
  FontWeight,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';

const NUMBER_OF_AGGREGATORS_TO_DISPLAY = 2;

const DetectedTokenAggregators = ({ aggregators }) => {
  const t = useI18nContext();
  const numOfHiddenAggregators =
    parseInt(aggregators.length, 10) - NUMBER_OF_AGGREGATORS_TO_DISPLAY;
  const [displayMore, setDisplayMore] = useState(false);

  return (
    <Box display={DISPLAY.INLINE_FLEX} className="detected-token-aggregators">
      <Text
        variant={TextVariant.bodySm}
        as="h6"
        fontWeight={FontWeight.Normal}
      >
        {t('fromTokenLists', [
          numOfHiddenAggregators > 0 && !displayMore ? (
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Normal}
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
            </Text>
          ) : (
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Normal}
              key="detected-token-aggrgators-without-more"
            >
              {`${aggregators.join(', ')}.`}
            </Text>
          ),
        ])}
      </Text>
    </Box>
  );
};

DetectedTokenAggregators.propTypes = {
  aggregators: PropTypes.array.isRequired,
};

export default DetectedTokenAggregators;
