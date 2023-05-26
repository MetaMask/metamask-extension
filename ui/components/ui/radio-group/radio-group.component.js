import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import { Color, TextVariant } from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';

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
                <Text
                  color={Color.successDefault}
                  className="radio-group__column-recommended"
                  variant={TextVariant.bodySm}
                  as="h6"
                >
                  {option.recommended ? t('recommendedGasLabel') : ''}
                </Text>
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
              <Text
                color={checked ? Color.textDefault : Color.textMuted}
                variant={TextVariant.bodySmBold}
                as="h6"
                className="radio-group__column-label"
              >
                {option.label}
              </Text>
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
