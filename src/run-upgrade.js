const waitFor = require('./wait-for')
const connectToNode = require('./connect-to-node')
const runSysupgrade = require('./run-sysupgrade')
const printUpgradeTable = require('./print-upgrade-table')

module.exports = async (dir, nodes) => {
  let upgradingNodes = nodes
  const updateNode = newItem => upgradingNodes
  .map(r => {
    if (r.node === newItem.node) {
      return newItem
    }
    return r
  })
  printUpgradeTable(upgradingNodes)
  for (const node of nodes) {
    console.log(`Starting sysupgrade for ${node.node} with ${node.firmware}`)
    const ssh = await connectToNode(node.node)
    const sysupgrade = await runSysupgrade(ssh, node)
    updateNode(sysupgrade)
    printUpgradeTable(upgradingNodes)
    await waitFor(60, true)
    const restore = await runRestore(dir, sysupgrade)
    console.log("TCL: restore", restore)
    await waitFor(60, true)
  }
  printUpgradeTable(upgradingNodes)
  return upgradingNodes
}
