import React from 'react';
import { render } from '@testing-library/react';
import NetworkFilterDropdown from '.';

describe('NetworkFilterDropdown', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <NetworkFilterDropdown
        title="mockTitle"
        buttonDataTestId="mockButtonDataTestId"
        isCurrentNetwork={true}
        openListNetwork={() => {}}
        currentNetworkImageUrl="mockCurrentNetworkImageUrl"
        allOpts={{}}
        isDropdownOpen={true}
        setIsDropdownOpen={() => {}}
        dropdownRef={React.createRef()}
      />,
    );
    expect(getByTestId('mockButtonDataTestId')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
