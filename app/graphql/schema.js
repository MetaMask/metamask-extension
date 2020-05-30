import { buildSchema } from 'graphql'
import { counterResolvers } from './counter'

export const schema = buildSchema(`
type Counter {
  previous: Int
  current: Int!
}

type Query {
  counter: Counter
}

type Subscription {
  counterIncremented: Counter
}`)

export const resolvers = {
  ...counterResolvers,
}
