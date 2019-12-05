const execute = require('./ssh-exec')
const getHostName = require('./get-hostname')
module.exports = async ssh => {
  try {
    const getNodes = await execute(ssh, 'ubus call lime-utils get_cloud_nodes')
    let {nodes} = await JSON.parse(getNodes)
    const hostname = await getHostName(ssh)
    const exists = nodes.indexOf(hostname) !== -1

    return {
      nodes: exists ? nodes : [hostname, ...nodes],
      hostname,
    }
  } catch (error) {
    throw error
  }
}
