import React, { useState, useEffect } from 'react'
import { storiesMetadata } from './loading-swaps-quotes-stories-metadata'
import LoadingSwapsQuotes from './loading-swaps-quotes'

export default {
  title: 'LoadingSwapsQuotes',
}

export const FasterThanExpectedCompletion = () => {
  const [loading, setLoading] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done && !loading) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setLoadingComplete(true)
      }, 3000)
    }
  }, [done, loading])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ height: '600px', width: '357px', border: '1px solid grey' }}>
        <LoadingSwapsQuotes
          loadingComplete={loadingComplete}
          onDone={() => setDone(true)}
          aggregatorMetadata={storiesMetadata}
        />
      </div>
    </div>
  )
}

export const SlowerThanExpectedCompletion = () => {
  const [loading, setLoading] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done && !loading) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setLoadingComplete(true)
      }, 10000)
    }
  }, [done, loading])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ height: '600px', width: '357px', border: '1px solid grey' }}>
        <LoadingSwapsQuotes
          loadingComplete={loadingComplete}
          onDone={() => setDone(true)}
          aggregatorMetadata={storiesMetadata}
        />
      </div>
    </div>
  )
}

export const FasterThanExpectedCompletionWithError = () => {
  const [loading, setLoading] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done && !loading) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setLoadingComplete(true)
      }, 3000)
    }
  }, [done, loading])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ height: '600px', width: '357px', border: '1px solid grey' }}>
        <LoadingSwapsQuotes
          loadingComplete={loadingComplete}
          onDone={() => setDone(true)}
          aggregatorMetadata={storiesMetadata}
        />
      </div>
    </div>
  )
}
