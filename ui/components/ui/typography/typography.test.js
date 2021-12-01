import * as React from 'react';
import { render } from '@testing-library/react';
import Typography from '.';

describe('Typography', () => {
  it('should render the Typography without crashing', () => {
    const { getByText } = render(<Typography>Test type</Typography>);
    expect(getByText('Test type')).toBeDefined();
  });
  it('should render the Typography with correct html tags', () => {
    const { getByText, container } = render(
      <>
        <Typography tag="p">p tag</Typography>
        <Typography tag="h1">h1 tag</Typography>
        <Typography tag="h2">h2 tag</Typography>
        <Typography tag="h3">h3 tag</Typography>
        <Typography tag="h4">h4 tag</Typography>
        <Typography tag="h5">h5 tag</Typography>
        <Typography tag="h6">h6 tag</Typography>
        <Typography tag="span">span tag</Typography>
        <Typography tag="strong">strong tag</Typography>
        <Typography tag="em">em tag</Typography>
        <Typography tag="li">li tag</Typography>
        <Typography tag="div">div tag</Typography>
        <Typography tag="dt">dt tag</Typography>
        <Typography tag="dd">dd tag</Typography>
      </>,
    );
    expect(container.querySelector('p')).toBeDefined();
    expect(getByText('p tag')).toBeDefined();
    expect(container.querySelector('h1')).toBeDefined();
    expect(getByText('h1 tag')).toBeDefined();
    expect(container.querySelector('h2')).toBeDefined();
    expect(getByText('h2 tag')).toBeDefined();
    expect(container.querySelector('h3')).toBeDefined();
    expect(getByText('h3 tag')).toBeDefined();
    expect(container.querySelector('h4')).toBeDefined();
    expect(getByText('h4 tag')).toBeDefined();
    expect(container.querySelector('h5')).toBeDefined();
    expect(getByText('h5 tag')).toBeDefined();
    expect(container.querySelector('h6')).toBeDefined();
    expect(getByText('h6 tag')).toBeDefined();
    expect(container.querySelector('span')).toBeDefined();
    expect(getByText('span tag')).toBeDefined();
    expect(container.querySelector('strong')).toBeDefined();
    expect(getByText('strong tag')).toBeDefined();
    expect(container.querySelector('em')).toBeDefined();
    expect(getByText('em tag')).toBeDefined();
    expect(container.querySelector('li')).toBeDefined();
    expect(getByText('li tag')).toBeDefined();
    expect(container.querySelector('div')).toBeDefined();
    expect(getByText('div tag')).toBeDefined();
    expect(container.querySelector('dt')).toBeDefined();
    expect(getByText('dt tag')).toBeDefined();
    expect(container.querySelector('dd')).toBeDefined();
    expect(getByText('dd tag')).toBeDefined();
  });
});
