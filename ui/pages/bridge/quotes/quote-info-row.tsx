import React from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import Tooltip from '../../../components/ui/tooltip';
import { IconColor } from '../../../helpers/constants/design-system';

export const QuoteInfoRow = ({
  label,
  tooltipText,
  description,
  secondaryDescription,
}: {
  label: string;
  tooltipText?: string;
  description: string;
  secondaryDescription?: string;
}) => {
  return (
    <Box className="info-row">
      <Box className="info-row__label">
        <Text>{label}</Text>
        {tooltipText && (
          <Tooltip
            position="top"
            title={tooltipText}
            containerClassName="info-row__label__tooltip"
            style={{ display: 'flex' }}
          >
            <Icon
              color={IconColor.iconMuted}
              name={IconName.Question}
              size={IconSize.Sm}
            />
          </Tooltip>
        )}
      </Box>

      <Box className="info-row__description">
        <Box className="info-row__description__secondary">
          <Text>{secondaryDescription}</Text>
        </Box>
        <Text>{description}</Text>
      </Box>
    </Box>
  );
};
