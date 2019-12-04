const execute = require('./ssh-exec')
module.exports = async ssh => {
  try {
    const getHostName = await execute(ssh, 'echo $HOSTNAME')
    const getNodes = await execute(ssh, 'ubus call lime-utils get_cloud_nodes')
    let {nodes} = await JSON.parse(getNodes)
    const hostname = getHostName
    const exists = nodes.indexOf(hostname) !== -1

    return {
      nodes: exists ? nodes : [hostname, ...nodes],
      hostname,
    }
  } catch (error) {
    throw error
  }
}
