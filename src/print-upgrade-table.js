const Table = require('cli-table3')
const chalk = require('chalk')

module.exports = (nodes, latestRevision) => {
  const table = new Table({
    head: ['Hops', 'Name', 'IP', 'model', 'Backup', 'Firmware', 'Upgrade', 'Restore', 'Version'],
    colWidths: [6, 20, 15, 15, 10, 10, 10, 10, 12],
  })

  // table is an Array, so you can `push`, `unshift`, `splice` and friends
  nodes.forEach(node => {
    let backup = 'Loading'
    let isUpToDate = null
    let revision = node.board ? chalk.red(node.board.release.revision) : '-'
    let firmware = '-'
    let upgrade = '-'
    let restore = '-'

    if (node.backup) {
      backup = node.backup.backup.error ? chalk.red('Error') : chalk.green('Ok')
    }
    if (node.firmware) {
      firmware = node.firmware.error ? chalk.red('Error') : chalk.green('Ok')
    }
    if (node.upgrade) {
      upgrade = node.upgrade.error ? chalk.red('Error') : chalk.green('Ok')
    } else {
      upgrade = isUpToDate ? chalk.green('Ok') : '-'
    }
    if (node.restore) {
      restore = node.restore.error ? chalk.red('Error') : chalk.green('Ok')
    }
    if (latestRevision && node.board) {
      isUpToDate = node.board.release.version === latestRevision
      revision = isUpToDate ? chalk.green(node.board.release.revision) : chalk.red(node.board.release.revision)
    }
    table.push([
      node.distance || '-',
      node.node,
      node.ip,
      node.board ? node.board.board_name : '-',
      backup,
      firmware,
      upgrade,
      restore,
      revision,
    ])
  })
  if (process.env.NODE_ENV !== 'development') {
    console.clear()
  }
  console.log(table.toString())
}
