import React, { useState } from 'react';
import { Box, Text } from '../../../../components/component-library';
import {
  Display,
  FlexDirection,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  readInspectorSettings,
  writeInspectorSettings,
  type InspectorSettings,
} from '../../../../dev/page-object-inspector/mode';
import ToggleRow from './toggle-row-component';

/**
 * Controls the overlay that shows which E2E page object owns each element of
 * the running wallet.
 *
 * @returns The settings section.
 */
export const PageObjectInspectorSettings = () => {
  const [settings, setSettings] = useState<InspectorSettings>(
    readInspectorSettings,
  );

  const update = (change: Partial<InspectorSettings>) => {
    const next = { ...settings, ...change };
    setSettings(next);
    writeInspectorSettings(next);
  };

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      <Text className="settings-page__security-tab-sub-header__bold">
        Page object inspector
      </Text>
      <Text
        className="settings-page__security-tab-sub-header"
        color={TextColor.textAlternative}
        paddingTop={2}
      >
        Shows which E2E page object owns each element on screen. Only elements
        located by a data-testid are covered. Regenerate the index with `yarn
        page-objects:index` after changing a page object.
      </Text>
      <div className="settings-page__content-padded">
        <ToggleRow
          title="Outline owned elements"
          description="Tint every element a page object owns in that page object’s colour. Elements two page objects both claim are marked in red."
          isEnabled={settings.outline}
          onToggle={() => update({ outline: !settings.outline })}
          dataTestId="page-object-inspector-outline-toggle"
        />
        <ToggleRow
          title="Show details on hover"
          description="Point at an element to see the owning page object, its property name and the source file and line that declare it."
          isEnabled={settings.hover}
          onToggle={() => update({ hover: !settings.hover })}
          dataTestId="page-object-inspector-hover-toggle"
        />
      </div>
    </Box>
  );
};
