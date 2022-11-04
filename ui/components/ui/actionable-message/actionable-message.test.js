import React from 'react';
import { fireEvent } from '@testing-library/react';

import { renderWithProvider } from '../../../../test/jest';
import ActionableMessage from '.';

const createProps = (customProps = {}) => {
  return {
    message: 'I am an actionable message!',
    ...customProps,
  };
};

describe('ActionableMessage', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <ActionableMessage {...props} />,
    );
    expect(getByText(props.message)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders button for primaryActionV2 prop', () => {
    const props = createProps();
    const { getByRole } = renderWithProvider(
      <ActionableMessage
        {...props}
        primaryActionV2={{ label: 'primary-action-v2' }}
      />,
    );
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('renders primaryActionV2.onClick is callen when primaryActionV2 button is clicked', () => {
    const props = createProps();
    const onClick = jest.fn();
    const { getByRole } = renderWithProvider(
      <ActionableMessage
        {...props}
        primaryActionV2={{ label: 'primary-action-v2', onClick }}
      />,
    );
    fireEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
