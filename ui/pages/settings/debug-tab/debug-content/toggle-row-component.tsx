import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import ToggleButton from '../../../../components/ui/toggle-button';

const ToggleRow = ({
  title,
  description,
  isEnabled,
  onToggle,
  dataTestId,
  settingsRef,
}: {
  title: string;
  description: string;
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
  dataTestId: string;
  settingsRef?: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <Box
      ref={settingsRef}
      className="settings-page__content-row"
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
    >
      <div className="settings-page__content-item">
        <div className="settings-page__content-description">
          <span>{title}</span>
          <div className="settings-page__content-description">
            {description}
          </div>
        </div>
      </div>

      <div className="settings-page__content-item-col">
        <ToggleButton
          value={isEnabled}
          onToggle={onToggle}
          offLabel="Off"
          onLabel="On"
          dataTestId={dataTestId}
        />
      </div>
    </Box>
  );
};

export default ToggleRow;
