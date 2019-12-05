const execute = require('./ssh-exec')

module.exports = async ssh => {
  const getHostName = await execute(ssh, 'echo $HOSTNAME')
  return getHostName
}
