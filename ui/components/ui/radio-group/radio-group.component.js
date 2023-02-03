import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import Typography from '../typography/typography';
import {
  Color,
  FONT_WEIGHT,
  TypographyVariant,
} from '../../../helpers/constants/design-system';

function Connector({ isFirst, isLast }) {
  if (isFirst) {
    return <div className="radio-group__column-start-connector" />;
  } else if (isLast) {
    return <div className="radio-group__column-end-connector" />;
  }
  return (
    <>
      <div className="radio-group__column-vertical-line" />
      <div className="radio-group__column-horizontal-line" />
    </>
  );
}

Connector.propTypes = {
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
};

export default function RadioGroup({ options, name, selectedValue, onChange }) {
  const t = useContext(I18nContext);

  const hasRecommendation = Boolean(
    options.find((option) => option.recommended),
  );

  return (
    <div
      className={classNames('radio-group', {
        'radio-group--has-recommendation': hasRecommendation,
      })}
    >
      {options.map((option, index) => {
        const checked = option.value === selectedValue;
        return (
          <div className="radio-group__column" key={`${name}-${option.value}`}>
            <label className="radio-group__column-inner">
              {hasRecommendation && (
                <Typography
                  color={Color.successDefault}
                  className="radio-group__column-recommended"
                  variant={TypographyVariant.H7}
                >
                  {option.recommended ? t('recommendedGasLabel') : ''}
                </Typography>
              )}
              <div className="radio-group__column-radio">
                <input
                  type="radio"
                  name={name}
                  checked={checked}
                  value={option.value}
                  onChange={() => onChange?.(option.value)}
                />
              </div>
              <Connector
                isFirst={index === 0}
                isLast={index === options.length - 1}
              />
              <Typography
                color={checked ? Color.textDefault : Color.textMuted}
                fontWeight={FONT_WEIGHT.BOLD}
                variant={TypographyVariant.H7}
                className="radio-group__column-label"
              >
                {option.label}
              </Typography>
            </label>
          </div>
        );
      })}
    </div>
  );
}

RadioGroup.propTypes = {
  /**
   * Predefined options for radio group
   */
  options: PropTypes.array,
  /**
   * Show selected value
   */
  selectedValue: PropTypes.string,
  /**
   * Show name as label
   */
  name: PropTypes.string,
  /**
   * Handler for onChange
   */
  onChange: PropTypes.func,
};

RadioGroup.defaultProps = {
  options: [],
};
