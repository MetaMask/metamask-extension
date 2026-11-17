import React, { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ContentVariant,
  Icon,
  IconName,
  IconSize,
  ListItem,
  TextColor,
} from '@metamask/design-system-react';
import { transitionForward } from '../../../components/ui/transition';

type SettingsSelectItemProps = {
  label: string;
  /** Text value to display, or a ReactNode for custom content (e.g., icon + text) */
  value: string | ReactNode;
  /** Route to navigate to when the item is selected */
  to: string;
  /** Optional test id for the clickable navigation control */
  dataTestId?: string;
  /** Optional leading content (e.g., an icon) rendered before the label */
  startAccessory?: ReactNode;
};

export const SettingsSelectItem = ({
  label,
  value,
  to,
  dataTestId,
  startAccessory,
}: SettingsSelectItemProps) => {
  const navigate = useNavigate();

  return (
    <Link
      to={to}
      className="block hover:bg-background-default-hover"
      data-testid={dataTestId}
      onClick={(event) => {
        event.preventDefault();
        transitionForward(() => navigate(to));
      }}
    >
      <ListItem
        variant={ContentVariant.OneLine}
        accessoryGap={4}
        startAccessory={startAccessory}
        title={label}
        value={value}
        valueProps={
          typeof value === 'string'
            ? { color: TextColor.TextAlternative }
            : undefined
        }
        valueEndAccessory={
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        }
      />
    </Link>
  );
};
