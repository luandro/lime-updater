/* eslint-disable no-console */

const Table = require('cli-table3')
const chalk = require('chalk')

module.exports = (nodes, latestRevision) => {
  const table = new Table({
    head: ['Hops', 'Name', 'Expected ip', 'model', 'Backup', 'Put-file', 'Restored', 'Version'],
    colWidths: [6, 20, 15, 15, 10, 10, 10, 10, 12],
  })

  // table is an Array, so you can `push`, `unshift`, `splice` and friends
  nodes.forEach(node => {
    let backup = 'Loading'
    let isUpToDate = null
    let revision = node.board ? chalk.red(node.board.release.revision) : '-'
    let connected = '-'
    let restore = '-'

    if (node.backup) {
      backup = node.backup.backup.error ? chalk.red('Error') : chalk.green('Ok')
    }
    if (node.restore && node.restore.file) {
      connected = node.restore.file.error ? chalk.red('Error') : chalk.green('Ok')
    }
    if (node.restore && node.restore.done) {
      restore = node.restore.done.error ? chalk.red('Error') : chalk.green('Ok')
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
      connected,
      restore,
      revision,
    ])
  })
  if (process.env.NODE_ENV !== 'development') {
    console.clear()
  }
  console.log(table.toString())
}
