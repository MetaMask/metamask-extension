import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SelectedAccount from '.';

describe('SelectedAccount Component', () => {
  const props = {
    selectedIdentity: {
      name: 'testName',
      address: '0x1b82543566f41a7db9a9a75fc933c340ffb55c9d',
    },
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <SelectedAccount.WrappedComponent {...props} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render checksummed address', () => {
    const { queryByText } = renderWithProvider(
      <SelectedAccount.WrappedComponent {...props} />,
    );

    expect(queryByText('0x1B8...5C9D')).toBeInTheDocument();
    expect(queryByText(props.selectedIdentity.name)).toBeInTheDocument();
  });
});
