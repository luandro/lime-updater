const cliProgress = require('cli-progress')
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

module.exports = async (secs, showProgress) => new Promise(resolve => {
  let passedSecs = 0
  function add() {
    if (passedSecs < secs) {
      passedSecs++
      bar.update(passedSecs)
      console.clear()
      timeout()
    } else {
      bar.stop()
      resolve()
    }
  }
  function timeout() {
    return setTimeout(add, 1000)
  }
  if (showProgress) {
    bar.start(secs, 0)
    return timeout()
  }
  return setTimeout(resolve, secs * 1000)
})
