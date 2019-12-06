const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const chalk = require('chalk')
const homedir = require('os').homedir()

const waitFor = require('./wait-for')
const connectToNode = require('./connect-to-node')
const getMeshNodes = require('./get-mesh-nodes')
const getHostName = require('./get-hostname')
const getlatestRevision = require('./get-latest-revision')
const getRoutes = require('./get-routes')
const printNodesTable = require('./print-nodes-table')
const runBackup = require('./run-backup')
const runFirmwareCheck = require('./run-firmware-check')
const runUpgrade = require('./run-upgrade')
const runRestore = require('./run-restore')

const log = console.log
const clear = console.clear
const appDir = `${homedir}/.libremesh`

async function doUpgrade({dir, nodes, hostname, msg, firmwarePath, latestRevision}) {
  const promptProceed = await cli.confirm(`Are you sure you want to proceed upgrading the firmware for ${msg} (y/n)`)
  if (promptProceed) {
    // const isThisNode = nodes.filter(n => n.node === hostname)[0]
    const upgradeMsg = nodes.length > 1 ? 'Finding, sending and checking firmware for all nodes' : `Finding, sending and checking firmware for ${nodes[0].node}`
    log(upgradeMsg)
    const firmwareCheck = await runFirmwareCheck(nodes, firmwarePath, latestRevision)
    if (firmwareCheck) {
      const errors = firmwareCheck.filter(i => i.firmware.error)
      if (errors.length === 0) {
        log('Time to execute the upgrade!')
        const promptUpgrade = await cli.confirm(`Are you sure you want to upgrade the firmware for ${msg} (y/n)`)
        if (promptUpgrade) {
          const upgrade = await runUpgrade(firmwareCheck)
          return upgrade
        }
      }
    }
  }
  chalk.red(log('Got errors!'))
  return false
}

async function backupAndUpgrade(opts, exit) {
  const {dir, nodes, hostname, msg, firmwarePath, latestRevision} = opts
  const promptContinue = await cli.confirm(`Continue with backup for ${msg} (y/n)`)
  if (promptContinue) {
    const backups = await runBackup(nodes, dir)
    const upgrade = await doUpgrade({dir, nodes: backups, hostname, msg, firmwarePath, latestRevision})
    return upgrade
  }
  exit()
}

class LimeUpdaterCommand extends Command {
  async run() {
    const {flags} = this.parse(LimeUpdaterCommand)
    const postInstall = flags.post_install
    const initialNode = flags.initial_node
    const dataDir = flags.data_dir || appDir
    const firmwarePath = flags.firmware
    const nodesFlag = flags.nodes
    const dontAsk = flags.yes
    const customNodes = nodesFlag ? nodesFlag.split(',') : null
    if (process.env.NODE_ENV !== 'development') {
      clear()
    }
    /* Get revison */
    chalk.blue(log('Welcome, lets start by getting the latest LibreMesh revision'))
    cli.action.start('Getting revision')
    const latestRevision = process.env.NODE_ENV === 'development' ? 'a5ab2e48bc9e6318c3928a5164238baa731af1d3' : await getlatestRevision()
    cli.action.stop('Got Revision')
    if (latestRevision) chalk.cyan(log('Latest LibreMesh revision:', latestRevision))
    /* In case post-install option */
    if (postInstall) {
      const restore = await runRestore({
        dir: dataDir,
        nodes: customNodes,
        latestRevision,
      })
      if (restore) {
        log('Restore complete!')
      }
      console.log("TCL: LimeUpdaterCommand -> run -> restore", restore)
      this.exit()
    }
    /* Get mesh nodes */
    cli.action.start('Lets connect to this node')
    const thisNodeSsh = await connectToNode(initialNode || 'thisnode.info')
    let nodes
    let hostname
    if (customNodes) {
      chalk.yellow(log('Running for nodes:', nodesFlag))
      hostname = await getHostName(thisNodeSsh)
      nodes = customNodes
    } else {
      const res = await getMeshNodes(thisNodeSsh)
      nodes = res.nodes
      hostname = res.hostname
    }
    cli.action.stop('Connected!')
    /* Get data from nodes */
    printNodesTable(nodes, latestRevision)
    const sortedNodes = await getRoutes(thisNodeSsh, nodes, hostname, latestRevision)
    const outOfDateNodes = sortedNodes.filter(i => {
      if (i.board && !i.board.error) {
        return i.board.release.version !== latestRevision
      }
    })
    const hasError = sortedNodes.filter(i => {
      if (i && i.error) {
        return i
      }
      if (i.board && i.ip) {
        if (i.board.error || i.ip.error) return i
      }
    })
    printNodesTable(sortedNodes, latestRevision)

    /* Prompts */
    const nodesMsg = outOfDateNodes.length < sortedNodes.length ? outOfDateNodes.map(i => i.node).join(', ') : 'all nodes'
    if (outOfDateNodes.length === 0 && hasError.length === 0) {
      log('Great job, everything up to date!')
      this.exit()
    } else if (hasError.length > 0) {
      chalk.red(log(`Had problems connecting to ${hasError.length} nodes in the mesh!`))
      this.exit()
    } else {
      const upgrade = await backupAndUpgrade({
        dir: dataDir,
        nodes: outOfDateNodes,
        hostname,
        msg: nodesMsg,
        firmwarePath,
        latestRevision,
      }, this.exit)
      if (upgrade) {
        waitFor(100, true)
        const restore = await runRestore({dir: dataDir, nodes: upgrade, latestRevision})
        waitFor(60, true)
        console.log("TCL: LimeUpdaterCommand -> run -> restore", restore)
      }
      else {
        this.exit()
      }
      console.log("TCL: LimeUpdaterCommand -> run -> upgrade", upgrade)
    }
  }
}

LimeUpdaterCommand.description = `Describe the command here
...
Extra documentation goes here
`

LimeUpdaterCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  initial_node: flags.string({char: 'i', description: 'Define the node from which you want to see the mesh perspective'}),
  post_install: flags.boolean({char: 'p', default: false, description: 'only run post install, copying files and setting configs to the nodes'}),
  data_dir: flags.string({char: 'd', description: 'Folder where to store backup data for the nodes.'}),
  nodes: flags.string({char: 'n', description: 'limits the upgrade to only the listed ones separated by `,` wihout spaces'}),
  yes: flags.boolean({char: 'y', default: false, description: 'run without asking for prompts'}),
  firmware: flags.string({char: 'f', description: 'can be an absolute path in your system of a url where the firmware live. The program expects the files to be arranged as they are cooked'})
}

module.exports = LimeUpdaterCommand
