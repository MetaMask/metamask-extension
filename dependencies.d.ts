declare module 'loglevel' {
  function debug(message: string | Record<string, unknown>): void;
  const log = { debug };
  export default log;
}
