const traceRouteToNode = require('./trace-route-to-node')
const connectToNode = require('./connect-to-node')
const getNodeIps = require('./get-node-ips')
const getBoardInfo = require('./get-board-info')
const printNodesTable = require('./print-nodes-table')

module.exports = async (thisNodeSsh, nodes, hostname) => {
  try {
    let routes = nodes
    for (const node of nodes) {
      let route = {}
      let ssh
      if (node === hostname) {
        ssh = thisNodeSsh
        route = {
          node: hostname,
          distance: 0,
        }
      } else {
        route = await traceRouteToNode(thisNodeSsh, node)
        ssh = await connectToNode(node)
      }
      if (ssh.error) {
        route.ip = {error: ssh.error}
        route.board = {error: ssh.error}
      } else {
        route.ip = await getNodeIps(ssh)
        route.board = await getBoardInfo(ssh)
      }
      routes = routes
      .map(r => {
        if (r === route.node) {
          return route
        }
        return r
      })
      .sort((a, b) => b.distance - a.distance)
      printNodesTable(routes)
    }
    return routes
  } catch (error) {
    throw error
  }
}
