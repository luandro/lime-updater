const traceRouteToNode = require('./trace-route-to-node')
const connectToNode = require('./connect-to-node')
const getNodeInfo = require('./get-node-info')
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
    const traceNode = async node => {
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
    const getInfo = async node => {
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
        const routeInfo = await getNodeInfo(ssh)
        thisRoute = Object.assign(thisRoute, routeInfo, {})
        updateRoute(thisRoute, routes)
      }
      updateRoute(thisRoute)
    }
    if (nodes.length > 1) {
      for (const node of nodes) {
        await traceNode(node)
      }
      for (const node of nodes) {
        await getInfo(node)
      }
    } else {
      await traceNode(nodes[0])
      await getInfo(nodes[0])
    }
    printNodesTable(routes, latestRevision)
    return routes
  } catch (error) {
    throw error
  }
}
