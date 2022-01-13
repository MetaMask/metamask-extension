import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { confusables } from 'unicode-confusables';
import Tooltip from '../tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

const Confusable = ({ input }) => {
  const t = useI18nContext();
  const confusableData = useMemo(() => {
    return confusables(input);
  }, [input]);

  return confusableData.map(({ point, similarTo }, index) => {
    const zeroWidth = similarTo === '';
    if (similarTo === undefined) {
      return point;
    }
    return (
      <Tooltip
        key={index.toString()}
        tag="span"
        position="top"
        title={
          zeroWidth
            ? t('confusableZeroWidthUnicode')
            : t('confusableUnicode', [point, similarTo])
        }
      >
        <span className="confusable__point">{zeroWidth ? '?' : point}</span>
      </Tooltip>
    );
  });
};

Confusable.propTypes = {
  input: PropTypes.string.isRequired,
};

export default Confusable;
