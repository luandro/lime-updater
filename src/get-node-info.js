const execute = require('./ssh-exec')

module.exports = async ssh => {
  try {
    // DO PARSING RIGHT!
    // const command = 'echo "[{\"board\":$(ubus call system board),\"status\":$(ubus call lime-utils get_node_status)]"'
    const getBoardInfo = await execute(ssh, 'ubus call system board')
    const boardInfo = await JSON.parse(getBoardInfo)

    const getNodeIps = await execute(ssh, 'ubus call lime-utils get_node_status')
    const info = await JSON.parse(getNodeIps)
    const res =  {
      ip: info.ips.filter(i => i.version === '4')[0].address.split('/')[0],
      board: boardInfo,
    }
    return res
  } catch (error) {
    return {
      error,
    }
  }
}
