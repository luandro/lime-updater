/* eslint-disable no-console, prefer-promise-reject-errors */
const NodeSSH = require('node-ssh')
const ssh = new NodeSSH()
const homedir = require('os').homedir()

const tryConnect = (host, username, retries) => new Promise((resolve, reject) => {
  let connectionTries = 0
  ssh.connect({
    host: host || 'thisnode.info',
    username: username || 'root',
    privateKey: `${homedir}/.ssh/id_rsa`,
  })
  .then(() => {
    resolve(ssh)
  })
  .catch(error => {
    connectionTries++
    if (connectionTries > 1) {
      console.log('Failed connecting: ', connectionTries)
    }
    error = {error: JSON.parse(JSON.stringify(error))}
    if (!retries || connectionTries >= retries) {
      reject({error})
    } else {
      console.log('Try again')
      return tryConnect(host, username, retries)
    }
  })
})

module.exports = tryConnect
