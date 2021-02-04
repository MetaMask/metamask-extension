import React from 'react';
import PropTypes from 'prop-types';
import { omit } from 'lodash';
import Typography from '../typography';
import {
  COLORS,
  SIZES,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import Tooltip from '../tooltip';

const MARGIN_MAP = {
  [SIZES.XS]: 0,
  [SIZES.SM]: 2,
  [SIZES.MD]: 4,
  [SIZES.LG]: 6,
  [SIZES.XL]: 8,
};

export default function DefinitionList({
  dictionary,
  termTypography = {},
  definitionTypography = {},
  tooltips = {},
  gapSize = SIZES.SM,
}) {
  return (
    <dl className="definition-list">
      {Object.entries(dictionary).map(([term, definition]) => (
        <React.Fragment key={`definition-for-${term}`}>
          <Typography
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            {...termTypography}
            boxProps={{
              marginTop: 0,
              marginBottom: 1,
            }}
            className="definition-list__term"
            tag="dt"
          >
            {term}
            {tooltips[term] && (
              <Tooltip
                title={tooltips[term]}
                position="top"
                containerClassName="definition-list__tooltip-wrapper"
              >
                <i className="fas fa-info-circle" />
              </Tooltip>
            )}
          </Typography>
          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.UI4}
            {...definitionTypography}
            boxProps={{
              marginTop: 0,
              marginBottom: MARGIN_MAP[gapSize],
            }}
            className="definition-list__definition"
            tag="dd"
          >
            {definition}
          </Typography>
        </React.Fragment>
      ))}
    </dl>
  );
}

DefinitionList.propTypes = {
  gapSize: PropTypes.oneOf(Object.values(SIZES)),
  dictionary: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
  tooltips: PropTypes.objectOf(PropTypes.string),
  termTypography: PropTypes.shape({
    ...omit(Typography.propTypes, ['tag', 'className', 'boxProps']),
  }),
  definitionTypography: PropTypes.shape({
    ...omit(Typography.propTypes, ['tag', 'className', 'boxProps']),
  }),
};
