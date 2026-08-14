import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { ThemeProvider } from '@mui/material/styles';
import configureStore from '../../../../store/store';
import { SnapInterfaceContextProvider } from '../../../../contexts/snaps';
import testData from '../../../../../.storybook/test-data';
import { muiPickerTheme } from '../snap-ui-renderer/utils';
import { SnapUIDateTimePicker } from './snap-ui-date-time-picker';

const store = configureStore(testData);

const pickerLocaleText = {
  clearButtonLabel: 'Clear',
  cancelButtonLabel: 'Cancel',
  okButtonLabel: 'OK',
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <ThemeProvider theme={muiPickerTheme}>
      <LocalizationProvider
        dateAdapter={AdapterLuxon}
        localeText={pickerLocaleText}
      >
        <SnapInterfaceContextProvider
          snapId="npm:@metamask/test-snap-bip44"
          interfaceId="test-interface"
          initialState={{}}
          context={{}}
        >
          <div style={{ maxWidth: 360, padding: 16 }}>{children}</div>
        </SnapInterfaceContextProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </Provider>
);

const meta: Meta<typeof SnapUIDateTimePicker> = {
  title: 'Components/App/Snaps/SnapUIDateTimePicker',
  component: SnapUIDateTimePicker,
  parameters: {
    docs: {
      description: {
        component:
          'A picker component used by Snaps to capture date, time, or datetime values. ' +
          'Renders a DatePicker, TimePicker, or DateTimePicker depending on the `type` prop, ' +
          'styled to match the MetaMask design system.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  argTypes: {
    type: {
      control: 'select',
      options: ['date', 'time', 'datetime'],
      description: 'The picker variant to render.',
    },
    name: {
      control: 'text',
      description: 'The name of the input.',
    },
    label: {
      control: 'text',
      description: 'Optional label rendered above the picker.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when no value is selected.',
    },
    error: {
      control: 'text',
      description: 'Optional error message rendered below the picker.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables interaction with the picker.',
    },
    disablePast: {
      control: 'boolean',
      description:
        'Disables selection of past dates (only applies to date and datetime).',
    },
    disableFuture: {
      control: 'boolean',
      description:
        'Disables selection of future dates (only applies to date and datetime).',
    },
    form: {
      control: 'text',
      description: 'Optional form identifier when used inside a form.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnapUIDateTimePicker>;

export const DateTime: Story = {
  args: {
    name: 'datetime-picker',
    type: 'datetime',
    label: 'Pick a date and time',
    placeholder: 'Select a date and time',
  },
};

export const DateOnly: Story = {
  args: {
    name: 'date-picker',
    type: 'date',
    label: 'Pick a date',
    placeholder: 'Select a date',
  },
};

export const TimeOnly: Story = {
  args: {
    name: 'time-picker',
    type: 'time',
    label: 'Pick a time',
    placeholder: 'Select a time',
  },
};

export const Disabled: Story = {
  args: {
    name: 'disabled-picker',
    type: 'datetime',
    label: 'Disabled picker',
    placeholder: 'Cannot interact',
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    name: 'error-picker',
    type: 'date',
    label: 'Date with error',
    placeholder: 'Select a date',
    error: 'A valid date is required',
  },
};

export const DisablePastDates: Story = {
  args: {
    name: 'no-past-picker',
    type: 'date',
    label: 'Future dates only',
    placeholder: 'Select a future date',
    disablePast: true,
  },
};
