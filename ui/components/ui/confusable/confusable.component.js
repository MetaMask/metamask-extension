import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { confusables } from 'unicode-confusables';
import { v4 as uuidv4 } from 'uuid';
import Tooltip from '../tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Text } from '../../component-library';

const Confusable = ({ input, asText, confusableWrapperName = '' }) => {
  const t = useI18nContext();
  const confusableData = useMemo(() => {
    return confusables(input);
  }, [input]);

  return confusableData.map(({ point, similarTo }) => {
    const zeroWidth = similarTo === '';
    if (similarTo === undefined) {
      return asText ? <Text key={uuidv4()}>{point}</Text> : point;
    }
    return (
      <Tooltip
        key={uuidv4()}
        tag="span"
        position="top"
        title={
          zeroWidth
            ? t('confusableZeroWidthUnicode')
            : t('confusableUnicode', [point, similarTo])
        }
        wrapperClassName={confusableWrapperName}
      >
        <Text className="confusable__point" as={asText ? 'p' : 'span'}>
          {zeroWidth ? '?' : point}
        </Text>
      </Tooltip>
    );
  });
};

Confusable.propTypes = {
  input: PropTypes.string.isRequired,
  asText: PropTypes.bool,
  confusableWrapperName: PropTypes.string,
};

export default Confusable;
