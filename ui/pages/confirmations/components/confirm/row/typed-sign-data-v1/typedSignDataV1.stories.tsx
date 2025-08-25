import React from 'react';

import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../components/app/confirm/info/row';
import { unapprovedTypedSignMsgV1 } from '../../../../../../../test/data/confirmations/typed_sign';
import { ConfirmInfoRowTypedSignDataV1 } from './typedSignDataV1';

const ConfirmInfoRowTypedSignDataStory = {
  title:
    'Pages/Confirmations/Components/Confirm/Row/TypedSignDataV1/ConfirmInfoRowTypedSignDataV1',

  component: ConfirmInfoRowTypedSignDataV1,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowVariant),
    },
    label: {
      control: 'text',
    },
  },
};

export const DefaultStory = ({ variant, data }) => (
  <ConfirmInfoRow label="Message" variant={variant}>
    <ConfirmInfoRowTypedSignDataV1 data={data} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  data: unapprovedTypedSignMsgV1.msgParams?.data,
};

export default ConfirmInfoRowTypedSignDataStory;
