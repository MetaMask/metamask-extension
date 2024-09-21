import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import { NoConnectionContent } from './no-connection';

describe('No Connections Content', () => {
  const render = () => {
    return renderWithProvider(<NoConnectionContent />);
  };
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
