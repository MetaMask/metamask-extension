import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import sinon from 'sinon';
import JwtDropdown from './jwt-dropdown';

describe('JwtDropdown', () => {
  it('should render the Jwt dropdown component', () => {
    const props = {
      jwtList: ['jwy1', 'jwt2'],
      currentJwt: 'someToken',
      onChange: sinon.spy(),
    };

    const { getByTestId, container } = render(<JwtDropdown {...props} />);

    fireEvent.change(getByTestId('jwt-dropdown'), {
      target: { value: 'jwt2' },
    });

    expect(getByTestId('jwt-dropdown')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
