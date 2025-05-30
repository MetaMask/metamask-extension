import { Container } from '@material-ui/core';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('new', () => {
  it('bips', () => {
    render(<Container />);
    screen.debug();
  });
});
