/* eslint-disable no-console */
const connect = require('./connect-to-node')
const log = console.log

module.exports = async ({ip, oldIp, hostname}) => {
  let retries = 0
  async function retry(ip) {
    log('Trying to connect to:', ip)
    return connect(ip, null, 1)
  }
  try {
    const ssh = await retry(ip)
    return ssh
  } catch (error) {
    retries++
    if (retries > 2) return false
    const next = retries === 1 ? oldIp : hostname
    log('Failed! Trying to connect to:', next)
    return retry(next)
  }
}
