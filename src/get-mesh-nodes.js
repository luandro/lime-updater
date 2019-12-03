const execute = require('./ssh-exec')
module.exports = async ssh => {
  try {
    const getHostName = await execute(ssh, 'echo $HOSTNAME')
    const getNodes = await execute(ssh, 'ubus call lime-utils get_cloud_nodes')
    const {nodes} = JSON.parse(getNodes)
    const hostname = getHostName
    return {
      nodes,
      hostname,
    }
  } catch (error) {
    throw error
  }
}
