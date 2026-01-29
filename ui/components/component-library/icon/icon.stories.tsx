import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import {
  AlignItems,
  Display,
  IconColor,
  FlexDirection,
  JustifyContent,
  TextVariant,
  FlexWrap,
  TextAlign,
  BackgroundColor,
  BorderColor,
  Color,
  TextColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';

import { Text } from '../text';
import { Icon } from './icon';
import { IconName, IconSize } from './icon.types';

import { Box } from '../box';
import { Label } from '../label';
import { TextFieldSearch } from '../text-field-search';
import { TextField, TextFieldSize } from '../text-field';
import { ButtonIcon, ButtonIconSize } from '../button-icon';
import { ButtonLink, ButtonLinkSize } from '../button-link';

export default {
  tags: ['autodocs'],
  title: 'Components/ComponentLibrary/Icon (deprecated)',
  component: Icon,
  parameters: {
    docs: {
      description: {
        component: '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  args: {
    name: IconName.AddSquare,
    color: IconColor.inherit,
    size: IconSize.Md,
  },
} as Meta<typeof Icon>;

export const DefaultStory: StoryFn<typeof Icon> = (args) => {
  const [search, setSearch] = useState('');
  const iconList = Object.keys(IconName)
    .filter(
      (item) =>
        search === '' ||
        item.toLowerCase().includes(search.toLowerCase().replace(' ', '_')),
    )
    .sort();

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleOnClear = () => {
    setSearch('');
  };

  return (
    <>
      <Text as="h2" marginBottom={2} variant={TextVariant.headingMd}>
        Icon search
      </Text>
      <Box
        display={Display.Grid}
        gap={2}
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}
      >
        <Box
          style={{ gridColumnStart: 1, gridColumnEnd: 3 }}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
        >
          {/* TODO replace with FormTextField */}
          <Label htmlFor="icon-search">IconName</Label>
          <TextFieldSearch
            id="icon-search"
            marginBottom={4}
            onChange={handleSearch}
            clearButtonOnClick={handleOnClear}
            value={search}
            placeholder="Search icon name"
          />
        </Box>
      </Box>
      {iconList.length > 0 ? (
        <Box
          display={Display.Grid}
          gap={2}
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          }}
        >
          {iconList.map((item) => {
            return (
              <Box
                borderColor={BorderColor.borderMuted}
                borderRadius={BorderRadius.MD}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                padding={4}
                key={item}
              >
                <Icon marginBottom={2} {...args} name={IconName[item]} />
                <TextField
                  placeholder={item}
                  value={item}
                  readOnly
                  size={TextFieldSize.Sm}
                  inputProps={{
                    variant: TextVariant.bodyXs,
                    textAlign: TextAlign.Center,
                  }}
                  backgroundColor={BackgroundColor.backgroundAlternative}
                  endAccessory={
                    <ButtonIcon
                      iconName={IconName.Copy}
                      size={ButtonIconSize.Sm}
                      color={IconColor.iconAlternative}
                      ariaLabel="Copy to clipboard"
                      title="Copy to clipboard"
                      onClick={() => {
                        const tempEl = document.createElement('textarea');
                        tempEl.value = item;
                        document.body.appendChild(tempEl);
                        tempEl.select();
                        document.execCommand('copy');
                        document.body.removeChild(tempEl);
                      }}
                    />
                  }
                />
              </Box>
            );
          })}
        </Box>
      ) : (
        <Text>
          No matches. Please try again or ask in the{' '}
          <ButtonLink
            size={ButtonLinkSize.Inherit}
            color={TextColor.primaryDefault}
            href="https://consensys.slack.com/archives/C0354T27M5M"
            target="_blank"
          >
            #metamask-design-system
          </ButtonLink>{' '}
          channel on slack.
        </Text>
      )}
    </>
  );
};
DefaultStory.storyName = 'Default';

