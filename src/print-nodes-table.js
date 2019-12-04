const Table = require('cli-table3')
const chalk = require('chalk')

module.exports = (nodes, latestRevision) => {
  const table = new Table({
    head: ['Hops', 'Model', 'Hostname', 'IP', 'Version'],
    colWidths: [10, 25, 25, 20, 15],
  })

  // table is an Array, so you can `push`, `unshift`, `splice` and friends
  nodes.forEach(node => {
    let isUpToDate = null
    let model = 'loading'
    let revision = 'loading'
    let ip = 'loading'
    if (node.board && !node.board.error && latestRevision) {
      isUpToDate = node.board.release.version === latestRevision
      model = node.board.model
      revision = isUpToDate ? chalk.green(node.board.release.revision) : chalk.red(node.board.release.revision)
    }
    if (node.ip && node.ip[0]) {
      ip = node.ip.filter(i => i.version === '4')[0].address.split('/')[0]
    }

    table.push([
      node.distance === undefined ? 'loading' : node.distance,
      model,
      node.node,
      ip,
      revision,
    ])
  })
  console.clear()
  console.log(table.toString())
}
