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
      if (node === hostname) {
        route = {
          node: hostname,
          distance: 0,
        }
      } else {
        route = await traceRouteToNode(thisNodeSsh, node)
      }
      updateRoute(route, routes)
    }
    for (const node of nodes) {
      let thisRoute = routes.filter(i => i.node === node)[0]
      let ssh
      if (node === hostname) {
        ssh = thisNodeSsh
      } else {
        ssh = await connectToNode(node)
      }
      if (ssh.error) {
        thisRoute.ip = {error: ssh.error}
        thisRoute.board = {error: ssh.error}
      } else {
        thisRoute.ip = await getNodeIps(ssh)
        updateRoute(thisRoute, routes)
        thisRoute.board = await getBoardInfo(ssh)
        updateRoute(thisRoute, routes)
      }
      updateRoute(thisRoute)
    }
    return routes
  } catch (error) {
    throw error
  }
}
