const connectToNode = require('./connect-to-node')
const nodeBackup = require('./node-backup')
const setupDir = require('./setup-dir')
const printUpgradeTable = require('./print-upgrade-table')

module.exports = async (nodes, dir) => {
  let nodeBackups = nodes
  const updateNode = newItem => nodeBackups
  .map(r => {
    if (r.node === newItem.node) {
      return newItem
    }
    return r
  })
  printUpgradeTable(nodeBackups)
  for (const node of nodes) {
    const folderName = node.ip
    const dataDir = await setupDir(folderName, dir)
    const ssh = await connectToNode(node.node)
    const backup = await nodeBackup(ssh, node, dataDir)
    nodeBackups = updateNode({
      ...node,
      backup,
    })
    printUpgradeTable(nodeBackups)
  }
  printUpgradeTable(nodeBackups)
  return nodeBackups
}
