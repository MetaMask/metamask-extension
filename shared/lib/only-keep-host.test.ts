import { onlyKeepHost } from './only-keep-host';

describe('onlyKeepHost', () => {
  it('returns only the host of the URL and drops everything else', () => {
    expect(onlyKeepHost('http://foo.com/bar')).toStrictEqual('foo.com');
  });

  it('preserves subdomains', () => {
    expect(onlyKeepHost('http://foo.bar.com/baz')).toStrictEqual('foo.bar.com');
  });
});
