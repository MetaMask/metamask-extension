import React from 'react';
import PropTypes from 'prop-types';

import {
  TypographyVariant,
  Color,
  BorderColor,
  BackgroundColor,
  TextColor,
  Severity,
} from '../../../helpers/constants/design-system';

import { BannerAlert } from '../../component-library';
import ApproveIcon from '../icon/approve-icon.component';
import Identicon from '../identicon/identicon.component';

import Chip from '.';

export default {
  title: 'Components/UI/Chip (deprecated)',
  component: Chip,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the `<Tag />` component instead.',
      },
    },
  },
  argTypes: {
    leftIcon: {
      control: {
        type: 'select',
      },
      options: ['ApproveIcon'],
      mapping: {
        ApproveIcon: (
          <ApproveIcon size={24} color="var(--color-success-default)" />
        ),
      },
    },
    rightIcon: {
      control: {
        type: 'select',
      },
      options: ['Identicon'],
      mapping: {
        Identicon: (
          <Identicon
            address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
            diameter={25}
          />
        ),
      },
    },
    label: {
      control: 'text',
    },
    labelProps: {
      color: {
        control: {
          type: 'select',
        },
        options: Object.values(Color),
      },
      variant: {
        color: {
          control: {
            type: 'select',
          },
          options: Object.values(TypographyVariant),
        },
      },
    },
    borderColor: {
      control: {
        type: 'select',
      },
      options: Object.values(BorderColor),
    },
    backgroundColor: {
      control: {
        type: 'select',
      },
      options: Object.values(BackgroundColor),
    },
    children: {
      control: 'text',
    },
  },
};

const Deprecated = ({ children }) => (
  <>
    <BannerAlert
      severity={Severity.Warning}
      title="Deprecated"
      description="<Chip/> has been deprecated in favor of <Tag/>"
      marginBottom={4}
    />
    {children}
  </>
);

Deprecated.propTypes = {
  children: PropTypes.node,
};

export const DefaultStory = (args) => (
  <Deprecated>
    <Chip {...args} />
  </Deprecated>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  label: 'Chip',
  borderColor: BorderColor.borderDefault,
  backgroundColor: BackgroundColor.backgroundAlternative,
  labelProps: {
    color: TextColor.textDefault,
    variant: TypographyVariant.H6,
  },
};
