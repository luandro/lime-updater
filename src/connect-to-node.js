const NodeSSH = require('node-ssh')
const ssh = new NodeSSH()
const homedir = require('os').homedir()

module.exports = async (host, username) => {
  try {
    await ssh.connect({
      host: host || 'thisnode.info',
      username: username || 'root',
      privateKey: `${homedir}/.ssh/id_rsa`,
    })
    return ssh
  } catch (error) {
    console.log('Error on connect-to-node', host, error)
    return {
      error: JSON.parse(JSON.stringify(error))
    }
  }
}
