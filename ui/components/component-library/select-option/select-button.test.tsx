import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import {
  AvatarAccount,
  AvatarAccountSize,
  SelectWrapper,
  SelectButton,
} from '..';
import { SelectOption } from '.';

describe('SelectOption', () => {
  it('renders without crashing', () => {
    const { getByText, container } = render(
      <SelectWrapper placeholder="Test" triggerComponent={<SelectButton />}>
        <SelectOption value="Test Option" />
      </SelectWrapper>,
    );
    expect(getByText('Test Button')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
