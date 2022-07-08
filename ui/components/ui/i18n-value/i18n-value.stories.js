import React from 'react';
import I18nValue from './i18n-value.component';

export default {
  title: 'Components/UI/I18nValue',
  id: __filename,
  component: I18nValue,
  argsTypes: {
    messageKey: {
      control: 'text',
    },
    options: {
      value: 'array',
    },
  },
};

export const DefaultI18nValue = (args) => {
  return <I18nValue {...args} />;
};

export const SubstitutedI18nValue = (args) => {
  return <I18nValue {...args} />;
};

DefaultI18nValue.storyName = 'Default';

DefaultI18nValue.args = {
  messageKey: 'notifications5Description',
};

SubstitutedI18nValue.storyName = 'Substitution';

SubstitutedI18nValue.args = {
  messageKey: 'transactionCreated',
  options: [80, 60],
};
