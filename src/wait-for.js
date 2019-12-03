module.exports = secs => {
  return new Promise(resolve => {
    setTimeout(resolve, secs * 1000)
  })
}
