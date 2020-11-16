import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { renderIcon } from '@download/blockies'

const BlockieIdenticon = ({ address, diameter }) => {
  const [dataUrl, setDataUrl] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    renderIcon({ seed: address.toLowerCase() }, canvas)
    const updatedDataUrl = canvas.toDataURL()

    if (updatedDataUrl !== dataUrl) {
      setDataUrl(updatedDataUrl)
    }
  }, [dataUrl, address])

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <img src={dataUrl} height={diameter} width={diameter} />
    </>
  )
}

BlockieIdenticon.propTypes = {
  address: PropTypes.string.isRequired,
  diameter: PropTypes.number.isRequired,
}

export default BlockieIdenticon
