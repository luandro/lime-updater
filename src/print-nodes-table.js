const Table = require('cli-table3')
const emoji = require('node-emoji')

module.exports = (nodes, latestRevision) => {
// console.log("TCL: nodes", nodes)
  // instantiate
  const table = new Table({
    head: ['Hops', 'Model', 'Hostname', 'Version'],
    colWidths: [10, 25, 25, 15],
  })

  // table is an Array, so you can `push`, `unshift`, `splice` and friends
  nodes.forEach(node => {
    const isUpToDate = node.board.release.version === latestRevision ? emoji.get('heavy_check_mark') : emoji.get('x')
    table.push([
      node.distance,
      node.board.model,
      node.node,
      node.board.release.revision + ' ' + isUpToDate,
    ])
  })
  console.log(table.toString())
}
