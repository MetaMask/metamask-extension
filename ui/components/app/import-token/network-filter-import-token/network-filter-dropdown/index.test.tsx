import React from 'react';
import { render } from '@testing-library/react';
import { NetworkFilterDropdown } from '.';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

describe('NetworkFilterDropdown', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <NetworkFilterDropdown
        title="mockTitle"
        buttonDataTestId="mockButtonDataTestId"
        isCurrentNetwork={true}
        openListNetwork={() => null}
        currentNetworkImageUrl="mockCurrentNetworkImageUrl"
        allOpts={{}}
        isDropdownOpen={true}
        setIsDropdownOpen={() => null}
        dropdownRef={React.createRef()}
      />,
    );
    expect(getByTestId('mockButtonDataTestId')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
