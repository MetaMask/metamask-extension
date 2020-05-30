import { pubsub } from './pubsub'

const COUNTER_INCREMENTED_TOPIC = 'counter-incremented'

const counter = {
  previous: null,
  current: 0,
}

export const counterResolvers = {
  // Returns an asyncIterator that is subscribed to COUNTER_INCREMENTED_TOPIC
  counterIncremented: () => pubsub.asyncIterator(COUNTER_INCREMENTED_TOPIC),
  counter: () => {
    return counter
  },
}

setInterval(() => {
  counter.previous = counter.current
  counter.current += 1
  // publishes a message to COUNTER_INCREMENTED_TOPIC, which triggers the asyncIterator
  pubsub.publish(COUNTER_INCREMENTED_TOPIC, { counterIncremented: counter })
}, 1000)
