import React from 'react'
import { useSubscription } from '@apollo/react-hooks'
import gql from 'graphql-tag'

const query = gql`
  subscription {
    counterIncremented {
      current
      previous
    }
  }
`
export default function Counter () {
  const { data } = useSubscription(query)

  return (
    <div>
      {data?.counterIncremented?.current && <p>current: {data.counterIncremented.current}</p>}
      <p>previous: {data?.counterIncremented?.previous}</p>
    </div>
  )
}
