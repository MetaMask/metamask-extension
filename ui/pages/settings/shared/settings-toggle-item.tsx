import React from 'react';
import {
  ContentVariant,
  ListItem,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import ToggleButton from '../../../components/ui/toggle-button';

export type SettingsToggleItemProps = {
  title: string;
  description?: string | React.ReactNode;
  value: boolean;
  onToggle: (value: boolean) => void;
  containerDataTestId?: string;
  dataTestId: string;
  disabled?: boolean;
};

export const SettingsToggleItem = ({
  title,
  description,
  value,
  onToggle,
  containerDataTestId,
  dataTestId,
  disabled,
}: SettingsToggleItemProps) => {
  const renderDescription = () => {
    if (!description) {
      return undefined;
    }
    if (typeof description === 'string') {
      return description;
    }
    return (
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        asChild
      >
        <div>{description}</div>
      </Text>
    );
  };

  return (
    <ListItem
      variant={description ? ContentVariant.MultiLine : ContentVariant.OneLine}
      title={title}
      description={renderDescription()}
      descriptionProps={
        typeof description === 'string'
          ? { variant: TextVariant.BodyMd }
          : undefined
      }
      endAccessory={
        <div data-testid={containerDataTestId}>
          <ToggleButton
            value={value}
            onToggle={onToggle}
            dataTestId={dataTestId}
            containerStyle={{ width: '40px' }}
            disabled={disabled}
          />
        </div>
      }
    />
  );
};
