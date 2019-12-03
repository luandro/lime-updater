const execute = require('./ssh-exec')

module.exports = async ssh => {
  try {
    const getBoardInfo = await execute(ssh, 'ubus call system board')
    const boardInfo = await JSON.parse(getBoardInfo)
    return boardInfo
  } catch (error) {
    return null
  }
}
