import 'unzipper';

declare module 'unzipper' {
  type Source = {
    stream: (offset: number, length: number) => NodeJS.ReadableStream;
    size: () => Promise<number>;
  };
  type Options = {
    tailSize?: number;
  };
  namespace Open {
    function custom(
      source: Source,
      options?: Options,
    ): Promise<CentralDirectory>;
  }
}
