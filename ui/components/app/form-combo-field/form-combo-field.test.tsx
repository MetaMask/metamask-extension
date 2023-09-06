import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import FormComboField from './form-combo-field';

const VALUE_MOCK = 'TestValue';
const PLACEHOLDER_MOCK = 'TestPlaceholder';
const NO_OPTIONS_TEXT_MOCK = 'TestNoOptionsText';

const OPTIONS_MOCK = [
  { primaryLabel: 'TestPrimaryLabel', secondaryLabel: 'TestSecondaryLabel' },
  { primaryLabel: 'TestPrimaryLabel2', secondaryLabel: 'TestSecondaryLabel2' },
];

describe('FormComboField', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders with options', async () => {
    const { baseElement, getByPlaceholderText } = renderWithProvider(
      <FormComboField
        value={VALUE_MOCK}
        options={OPTIONS_MOCK}
        placeholder={PLACEHOLDER_MOCK}
      />,
    );

    const input = getByPlaceholderText(PLACEHOLDER_MOCK);

    await act(async () => {
      fireEvent.click(input);
    });

    expect(baseElement).toMatchSnapshot();
  });

  it('renders with no options', async () => {
    const { baseElement, getByPlaceholderText } = renderWithProvider(
      <FormComboField
        value={VALUE_MOCK}
        options={[]}
        placeholder={PLACEHOLDER_MOCK}
        noOptionsText={NO_OPTIONS_TEXT_MOCK}
      />,
    );

    const input = getByPlaceholderText(PLACEHOLDER_MOCK);

    await act(async () => {
      fireEvent.click(input);
    });

    expect(baseElement).toMatchSnapshot();
  });

  it('calls onChange with primary label on option click', async () => {
    const onChangeMock = jest.fn();

    const { getByPlaceholderText, getByText } = renderWithProvider(
      <FormComboField
        value={VALUE_MOCK}
        options={OPTIONS_MOCK}
        placeholder={PLACEHOLDER_MOCK}
        noOptionsText={NO_OPTIONS_TEXT_MOCK}
        onChange={onChangeMock}
      />,
    );

    const input = getByPlaceholderText(PLACEHOLDER_MOCK);

    await act(async () => {
      fireEvent.click(input);
    });

    const option = getByText(OPTIONS_MOCK[0].primaryLabel);

    await act(async () => {
      fireEvent.click(option);
    });

    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith(OPTIONS_MOCK[0].primaryLabel);
  });

  it('calls onChange with empty string on clear button click', async () => {
    const onChangeMock = jest.fn();

    const { getByLabelText } = renderWithProvider(
      <FormComboField
        value={VALUE_MOCK}
        options={OPTIONS_MOCK}
        placeholder={PLACEHOLDER_MOCK}
        noOptionsText={NO_OPTIONS_TEXT_MOCK}
        onChange={onChangeMock}
      />,
    );

    const clearButton = getByLabelText('[clear]');

    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock).toHaveBeenCalledWith('');
  });
});
