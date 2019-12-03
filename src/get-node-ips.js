const execute = require('./ssh-exec')

module.exports = async ssh => {
  try {
    const getNodeInfo = await execute(ssh, 'ubus call lime-utils get_node_status')
    const info = await JSON.parse(getNodeInfo)
    return info.ips
  } catch (error) {
    return null
  }
}
