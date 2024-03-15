import React from 'react';

import { ConfirmInfoRow, ConfirmInfoRowVariant } from '../../../../../../components/app/confirm/info/row';
import { unapprovedTypedSignMsg } from '../../../../../../../test/data/confirmations/typed_sign';
import { ConfirmInfoRowTypedSignData } from './typedSignData';

const ConfirmInfoRowTypedSignDataStory = {
  title: 'Confirmations/Components/Confirm/InfoRowTypedSignData',

  component: ConfirmInfoRowTypedSignData,
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
    <ConfirmInfoRowTypedSignData data={data} />
  </ConfirmInfoRow>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  data: unapprovedTypedSignMsg.msgParams.data,
};

export default ConfirmInfoRowTypedSignDataStory;
