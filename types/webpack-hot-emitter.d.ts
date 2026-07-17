declare module 'webpack/hot/emitter' {
  import { EventEmitter } from 'events';

  const emitter: EventEmitter;
  export default emitter;
}
