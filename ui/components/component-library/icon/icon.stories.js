import React, { useState } from 'react';
import {
  SIZES,
  ALIGN_ITEMS,
  BLOCK_SIZES,
  DISPLAY,
  COLORS,
  ICON_COLORS,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  TEXT,
  FLEX_WRAP,
  TEXT_ALIGN,
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
  id: __filename,
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
      options: Object.values(ICON_COLORS),
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
    color: COLORS.INHERIT,
    size: SIZES.MD,
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
      <Text as="h2" marginBottom={2} variant={TEXT.HEADING_MD}>
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
                borderColor={COLORS.BORDER_MUTED}
                borderRadius={SIZES.MD}
                display={DISPLAY.FLEX}
                flexDirection={FLEX_DIRECTION.COLUMN}
                alignItems={ALIGN_ITEMS.CENTER}
                justifyContent={JUSTIFY_CONTENT.CENTER}
                padding={4}
                key={item}
              >
                <Icon marginBottom={2} {...args} name={ICON_NAMES[item]} />
                <TextField
                  placeholder={item}
                  value={item}
                  readOnly
                  size={SIZES.SM}
                  inputProps={{
                    variant: TEXT.BODY_XS,
                    textAlign: TEXT_ALIGN.CENTER,
                  }}
                  backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
                  rightAccessory={
                    <ButtonIcon
                      iconName={ICON_NAMES.COPY}
                      size={SIZES.SM}
                      color={COLORS.ICON_ALTERNATIVE}
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
            size={SIZES.AUTO}
            color={COLORS.PRIMARY_DEFAULT}
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
        console.log('item:', item);
        return (
          <Box
            borderColor={COLORS.BORDER_MUTED}
            borderRadius={SIZES.MD}
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
            alignItems={ALIGN_ITEMS.CENTER}
            justifyContent={JUSTIFY_CONTENT.CENTER}
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

export const Size = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.BASELINE}
      gap={1}
      marginBottom={4}
    >
      <Icon {...args} size={SIZES.XXS} />
      <Icon {...args} size={SIZES.XS} />
      <Icon {...args} size={SIZES.SM} />
      <Icon {...args} size={SIZES.MD} />
      <Icon {...args} size={SIZES.LG} />
      <Icon {...args} size={SIZES.XL} />
    </Box>
    <Text as="p" variant={TEXT.BODY_SM}>
      <Icon {...args} size={SIZES.AUTO} /> Auto also exists and inherits the
      font-size of the parent element.
    </Text>
  </>
);

export const Color = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE}>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.INHERIT} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.ICON_DEFAULT} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.ICON_ALTERNATIVE} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.ICON_MUTED} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.OVERLAY_DEFAULT}
    >
      <Icon {...args} color={COLORS.OVERLAY_INVERSE} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.PRIMARY_DEFAULT} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.PRIMARY_DEFAULT}
    >
      <Icon {...args} color={COLORS.PRIMARY_INVERSE} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.ERROR_DEFAULT} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.ERROR_DEFAULT}
    >
      <Icon {...args} color={COLORS.ERROR_INVERSE} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.SUCCESS_DEFAULT} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.SUCCESS_DEFAULT}
    >
      <Icon {...args} color={COLORS.SUCCESS_INVERSE} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.WARNING_DEFAULT} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.WARNING_DEFAULT}
    >
      <Icon {...args} color={COLORS.WARNING_INVERSE} />
    </Box>
    <Box padding={1} display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
      <Icon {...args} color={COLORS.INFO_DEFAULT} />
    </Box>
    <Box
      padding={1}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.INFO_DEFAULT}
    >
      <Icon {...args} color={COLORS.INFO_INVERSE} />
    </Box>
  </Box>
);

export const FontAwesome = () => (
  <>
    <Text marginBottom={3}>
      List of FontAwesome icons currently used that need to be swapped with
      Morph icon library
    </Text>
    <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP}>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-address-book" /> (fa-address-book)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-angle-double-left" /> (fa-angle-double-left)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-angle-double-right" /> (fa-angle-double-right)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-angle-down" /> (fa-angle-down)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-angle-left" /> (fa-angle-left)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-angle-right" /> (fa-angle-right)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-angle-up" /> (fa-angle-up)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-arrow-down" /> (fa-arrow-down)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-arrow-right" /> (fa-arrow-right)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-arrow-up" /> (fa-arrow-up)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-ban" /> (fa-ban)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-bell" /> (fa-bell)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-bold" /> (fa-bold)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-bolt" /> (fa-bolt)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-bullseye" /> (fa-bullseye)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-caret-down" /> (fa-caret-down)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-caret-up" /> (fa-caret-up)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-check" /> (fa-check)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-check-circle" /> (fa-check-circle)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-check-square" /> (fa-check-square)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-chevron-left" /> (fa-chevron-left)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-chevron-right" /> (fa-chevron-right)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-clock" /> (fa-clock)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-code" /> (fa-code)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-cog" /> (fa-cog)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-compass" /> (fa-compass)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-copy" /> (fa-copy)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-door-open" /> (fa-door-open)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-download" /> (fa-download)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fab fa-ethereum" /> (fa-ethereum)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-exclamation" /> (fa-exclamation)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-exclamation-circle" /> (fa-exclamation-circle)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-exclamation-triangle" /> (fa-exclamation-triangle)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-expand-alt" /> (fa-expand-alt)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-external-link-alt" /> (fa-external-link-alt)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-eye" /> (fa-eye)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-file" /> (fa-file)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-file-text-o" /> (fa-file-text-o)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-flask" /> (fa-flask)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-infinity" /> (fa-infinity)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-info" /> (fa-info)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-key" /> (fa-key)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-lock" /> (fa-lock)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-minus-square" /> (fa-minus-square)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fab fa-npm" /> (fa-npm)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-pencil-alt" /> (fa-pencil-alt)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-plug" /> (fa-plug)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-plus" /> (fa-plus)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-qrcode" /> (fa-qrcode)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-question" /> (fa-question)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-question-circle" /> (fa-question-circle)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-retweet" /> (fa-retweet)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-search" /> (fa-search)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-share-square" /> (fa-share-square)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-sliders-h" /> (fa-sliders-h)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-sort-amount" /> (fa-sort-amount)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-square" /> (fa-square)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-tag" /> (fa-tag)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-times" /> (fa-times)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-times-circle" /> (fa-times-circle)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-tint" /> (fa-tint)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-trash-alt" /> (fa-trash-alt)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fab fa-twitter" /> (fa-twitter)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-upload" /> (fa-upload)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-user" /> (fa-user)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-user-check" /> (fa-user-check)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-wifi" /> (fa-wifi)
      </Box>
      <Box
        width={[
          BLOCK_SIZES.FULL,
          BLOCK_SIZES.ONE_THIRD,
          BLOCK_SIZES.ONE_FOURTH,
          BLOCK_SIZES.ONE_SIXTH,
        ]}
        marginBottom={3}
      >
        <i className="fa fa-x" /> (fa-x)
      </Box>
    </Box>
  </>
);
