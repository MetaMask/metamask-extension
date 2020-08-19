import React, { useState, useEffect } from 'react'
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
      {!done && (
        <div style={{ height: '600px', width: '357px', border: '1px solid grey' }}>
          <LoadingSwapsQuotes
            loadingComplete={loadingComplete}
            onDone={() => setDone(true)}
          />
        </div>
      )}
      {done && (
        <div
          className="button btn-primary"
          style={{ cursor: 'pointer', width: '200px' }}
          onClick={() => {
            setLoadingComplete(false)
            setDone(false)
          }}
        >RESTART
        </div>
      )}
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
      {!done && (
        <div style={{ height: '600px', width: '357px', border: '1px solid grey' }}>
          <LoadingSwapsQuotes
            loadingComplete={loadingComplete}
            onDone={() => setDone(true)}
          />
        </div>
      )}
      {done && (
        <div
          className="button btn-primary"
          style={{ cursor: 'pointer', width: '200px' }}
          onClick={() => {
            setLoadingComplete(false)
            setDone(false)
          }}
        >RESTART
        </div>
      )}
    </div>
  )
}
