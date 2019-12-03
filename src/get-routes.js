const traceRouteToNode = require('./trace-route-to-node')
const connectToNode = require('./connect-to-node')
const getNodeIps = require('./get-node-ips')
const getBoardInfo = require('./get-board-info')

module.exports = async (nodes, hostname) => {
  try {
    const routes = await Promise.all(nodes.map(async node => {
      let route = {}
      if (node === hostname) {
        route = {
          node: hostname,
          distance: 0,
        }
      } else {
        route = await traceRouteToNode(node)
      }
      const ssh = await connectToNode(node)
      console.log('Connected to', node)
      route.ip = await getNodeIps(ssh)
      route.board = await getBoardInfo(ssh)
      return route
    }))
    const sortedRoutes = routes.sort((a, b) => b.distance - a.distance)
    return sortedRoutes
  } catch (error) {
    throw error
  }
}
