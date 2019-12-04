const traceRouteToNode = require('./trace-route-to-node')
const connectToNode = require('./connect-to-node')
const getNodeIps = require('./get-node-ips')
const getBoardInfo = require('./get-board-info')
const printNodesTable = require('./print-nodes-table')

module.exports = async (thisNodeSsh, nodes, hostname, latestRevision) => {
  try {
    let routes = nodes
    const updateRoute = newItem => {
      const newList = routes
      .map(r => {
        if (r === newItem.node) {
          return newItem
        }
        return r
      })
      .sort((a, b) => b.distance - a.distance)
      printNodesTable(newList, latestRevision)
      routes = newList
    }
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
        updateRoute(route, routes)
        ssh = await connectToNode(node)
      }
      if (ssh.error) {
        route.ip = {error: ssh.error}
        route.board = {error: ssh.error}
      } else {
        route.ip = await getNodeIps(ssh)
        updateRoute(route, routes)
        route.board = await getBoardInfo(ssh)
        updateRoute(route, routes)
      }
      updateRoute(route)
    }
    console.log("TCL: routes", routes)
    return routes
  } catch (error) {
    throw error
  }
}
