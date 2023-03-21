import React, { useState } from 'react';
import {
  Size,
  AlignItems,
  DISPLAY,
  IconColor,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
  FLEX_WRAP,
  TEXT_ALIGN,
  BackgroundColor,
  BorderColor,
  Color,
  BorderRadius,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import {
  ButtonIcon,
  ButtonLink,
  ICON_NAMES,
  ICON_SIZES,
  Icon,
  Label,
  Text,
  TextField,
  TextFieldSearch,
} from '..';

import README from './README.mdx';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/Icon',

  component: Icon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    name: {
      control: 'select',
      options: Object.values(ICON_NAMES),
    },
    size: {
      control: 'select',
      options: Object.values(ICON_SIZES),
    },
    color: {
      control: 'select',
      options: Object.values(IconColor),
    },
    className: {
      control: 'text',
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
  args: {
    name: ICON_NAMES.ADD_SQUARE,
    color: IconColor.inherit,
    size: Size.MD,
  },
};

export const DefaultStory = (args) => {
  const [search, setSearch] = useState('');
  const iconList = Object.keys(ICON_NAMES)
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
        display={DISPLAY.GRID}
        gap={2}
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}
      >
        <Box
          style={{ gridColumnStart: 1, gridColumnEnd: 3 }}
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          {/* TODO replace with FormTextField */}
          <Label htmlFor="icon-search">Name</Label>
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
          display={DISPLAY.GRID}
          gap={2}
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          }}
        >
          {iconList.map((item) => {
            return (
              <Box
                borderColor={BorderColor.borderMuted}
                borderRadius={Size.MD}
                display={DISPLAY.FLEX}
                flexDirection={FLEX_DIRECTION.COLUMN}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                padding={4}
                key={item}
              >
                <Icon marginBottom={2} {...args} name={ICON_NAMES[item]} />
                <TextField
                  placeholder={item}
                  value={item}
                  readOnly
                  size={Size.SM}
                  inputProps={{
                    variant: TextVariant.bodyXs,
                    textAlign: TEXT_ALIGN.CENTER,
                  }}
                  backgroundColor={BackgroundColor.backgroundAlternative}
                  endAccessory={
                    <ButtonIcon
                      iconName={ICON_NAMES.COPY}
                      size={Size.SM}
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
            size={Size.inherit}
            color={Color.primaryDefault}
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

export const Name = (args) => (
  <>
    <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP} gap={2}>
      {Object.keys(ICON_NAMES).map((item) => {
        return (
          <Box
            borderColor={BorderColor.borderMuted}
            borderRadius={Size.MD}
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            padding={4}
            key={item}
          >
            <Icon {...args} name={ICON_NAMES[item]} />
          </Box>
        );
      })}
    </Box>
  </>
);

export const SizeStory = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.baseline}
      gap={1}
      marginBottom={4}
    >
      <Icon {...args} size={Size.XS} />
      <Icon {...args} size={Size.SM} />
      <Icon {...args} size={Size.MD} />
      <Icon {...args} size={Size.LG} />
      <Icon {...args} size={Size.XL} />
    </Box>
    <Text variant={TextVariant.displayMd}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
    <Text variant={TextVariant.headingLg}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
    <Text variant={TextVariant.headingMd}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
    <Text variant={TextVariant.headingSm}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
    <Text variant={TextVariant.bodyLgMedium}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
    <Text variant={TextVariant.bodyMd}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
    <Text variant={TextVariant.bodySm}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
    <Text variant={TextVariant.bodyXs}>
      inherits the font-size of the parent element.{' '}
      <Icon {...args} size={Size.inherit} />
    </Text>
  </>
);
SizeStory.storyName = 'Size';

export const ColorStory = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline}>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.inherit} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.iconDefault} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.iconAlternative} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.iconMuted} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.overlayDefault}
    >
      <Icon {...args} color={IconColor.overlayInverse} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.primaryDefault} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.primaryDefault}
    >
      <Icon {...args} color={IconColor.primaryInverse} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.errorDefault} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.errorDefault}
    >
      <Icon {...args} color={IconColor.errorInverse} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.successDefault} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.successDefault}
    >
      <Icon {...args} color={IconColor.successInverse} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.warningDefault} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.warningDefault}
    >
      <Icon {...args} color={IconColor.warningInverse} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon {...args} color={IconColor.infoDefault} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.infoDefault}
    >
      <Icon {...args} color={IconColor.infoInverse} />
    </Box>
  </Box>
);
ColorStory.storyName = 'Color';

export const LayoutAndSpacing = () => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={4}>
    <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
      <Icon
        name={ICON_NAMES.CHECK}
        color={IconColor.successDefault}
        marginRight={1}
      />
      <Text>Always allow you to opt-out via Settings</Text>
    </Box>
    <Box
      as="button"
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.primaryMuted}
      marginRight="auto"
    >
      <Text color={Color.primaryDefault}>
        0x79fAaFe7B6D5DB5D8c63FE88DFF0AF1Fe53358db
      </Text>
      <Icon
        name={ICON_NAMES.COPY}
        color={IconColor.primaryDefault}
        marginLeft={1}
      />
    </Box>
    <Box
      as="button"
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      padding={4}
      borderColor={BorderColor.borderMuted}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Icon
        name={ICON_NAMES.ADD}
        color={IconColor.iconDefault}
        marginRight={2}
      />
      <Text>Create account</Text>
    </Box>
    <Label>
      Custom spending cap{' '}
      <Icon name={ICON_NAMES.INFO} size={ICON_SIZES.AUTO} marginLeft={1} />
    </Label>
    <div>
      <Text>
        <Icon
          name={ICON_NAMES.WARNING}
          size={ICON_SIZES.AUTO}
          marginLeft={1}
          color={IconColor.warningDefault}
        />{' '}
        Warning
      </Text>
    </div>
  </Box>
);
