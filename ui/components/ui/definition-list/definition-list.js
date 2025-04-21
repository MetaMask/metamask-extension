import React from 'react';
import PropTypes from 'prop-types';
import { omit } from 'lodash';
import {
  Size,
  TextVariant,
  OverflowWrap,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip';
import { Icon, IconName, IconSize, Text } from '../../component-library';

export default function DefinitionList({
  dictionary,
  termTypography = {},
  definitionTypography = {},
  tooltips = {},
  warnings = {},
}) {
  return (
    <dl className="definition-list">
      {Object.entries(dictionary).map(([term, definition]) => (
        <React.Fragment key={`definition-for-${term}`}>
          <Text
            variant={TextVariant.bodyMdMedium}
            {...termTypography}
            marginTop={0}
            className="definition-list__term"
            as="dt"
          >
            {term}
            {tooltips[term] && (
              <Tooltip
                title={tooltips[term]}
                position="top"
                containerClassName="definition-list__tooltip-wrapper"
              >
                <Icon
                  name={IconName.Question}
                  size={IconSize.Sm}
                  marginLeft={1}
                  color={IconColor.iconAlternative}
                />
              </Tooltip>
            )}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            {...definitionTypography}
            marginTop={0}
            marginBottom={4}
            className="definition-list__definition"
            overflowWrap={OverflowWrap.BreakWord}
            as="dd"
          >
            {definition}
          </Text>
          {warnings[term] && (
            <Text variant={TextVariant.bodySm} color={TextColor.warningDefault}>
              {warnings[term]}
            </Text>
          )}
        </React.Fragment>
      ))}
    </dl>
  );
}

DefinitionList.propTypes = {
  gapSize: PropTypes.oneOf(Object.values(Size)),
  dictionary: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
  tooltips: PropTypes.objectOf(PropTypes.string),
  warnings: PropTypes.objectOf(PropTypes.string),
  termTypography: PropTypes.shape({
    ...omit(TextVariant.propTypes, ['tag', 'className', 'boxProps']),
  }),
  definitionTypography: PropTypes.shape({
    ...omit(TextVariant.propTypes, ['tag', 'className', 'boxProps']),
  }),
};
