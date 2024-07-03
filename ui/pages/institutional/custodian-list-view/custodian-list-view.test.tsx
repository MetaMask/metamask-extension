import React from 'react';
import { render, waitFor } from '@testing-library/react';
import CustodianListView from './custodian-list-view';
import { Box } from '../../../components/component-library';

describe('CustodianListView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render CustodianListView', async () => {
    const mockCustodianList = [
      <Box>Custodian 1</Box>,
      <Box>Custodian 2</Box>,
      <Box>Custodian 3</Box>,
    ];
    const { container, getByText } = render(
      <CustodianListView custodianList={mockCustodianList} />,
    );
    expect(container).toMatchSnapshot();

    await waitFor(() => {
      expect(getByText('Custodian 1')).toBeInTheDocument();
      expect(getByText('Custodian 2')).toBeInTheDocument();
    });
  });
});
