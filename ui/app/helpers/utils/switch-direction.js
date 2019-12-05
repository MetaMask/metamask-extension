/**
 * Switch the CSS stylesheet used between 'rtl' and 'ltr'
 * @param {('ltr' | 'rtl')} direction Text direction, either left-to-right (ltr) or right-to-left (rtl)
 */
const switchDirection = async (direction) => {
  if (direction === 'auto') {
    direction = 'ltr'
  }
  let updatedLink
  Array.from(document.getElementsByTagName('link'))
    .filter(link => link.rel === 'stylesheet')
    .forEach(link => {
      if (link.title === direction && link.disabled) {
        link.disabled = false
        updatedLink = link
      } else if (link.title !== direction && !link.disabled) {
        link.disabled = true
      }
    })
  if (updatedLink) {
    return new Promise((resolve, reject) => {
      updatedLink.onload = () => {
        resolve()
      }
      updatedLink.onerror = () => reject(new Error(`Failed to load '${direction}' stylesheet`))
    })
  }
}

export default switchDirection
