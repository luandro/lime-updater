const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const chalk = require('chalk')

const waitFor = require('./wait-for')
const connectToNode = require('./connect-to-node')
const getMeshNodes = require('./get-mesh-nodes')
const getHostName = require('./get-hostname')
const getlatestRevision = require('./get-latest-revision')
const getRoutes = require('./get-routes')
const printNodesTable = require('./print-nodes-table')
const nodeBackup = require('./node-backup')
const upgrade = require('./upgrade')
const nodeConfig = require('./node-config')

const log = console.log
const clear = console.clear

class LimeUpdaterCommand extends Command {
  async run() {
    const {flags} = this.parse(LimeUpdaterCommand)
    const postInstall = flags.post_install
    const initialNode = flags.initial_node
    const dataDir = flags.data_dir
    const nodesFlag = flags.nodes
    const customNodes = nodesFlag ? nodesFlag.split(',') : null
    if (process.env.NODE_ENV !== 'development') {
      clear()
    }
    /* Get revison */
    chalk.blue(log('Welcome, lets start by getting the latest LibreMesh revision'))
    cli.action.start('Getting revision')
    const latestRevision = await getlatestRevision()
    cli.action.stop('Got Revision')
    if (latestRevision) chalk.cyan(log('Latest LibreMesh revision:', latestRevision))
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
    if (!postInstall && outOfDateNodes.length === 0 && hasError.length === 0) {
      log('Great job, everything up to date!')
      this.exit()
    } else if (postInstall) {
      const promptContinue = await cli.confirm('Continue upgrading nodes (Y/n)')
      if (promptContinue) {
        log(`Let's backup the configs and logs from the nodes into ${dataDir}`)
        clear()
        /* Send backup to each node */
        // await sortedNodes.forEach(async info => {
        //   const ssh = await connectToNode(info.node)
        //   const config = await nodeConfig(ssh, info)
        //   console.log("TCL: LimeUpdaterCommand -> run -> config", config)
        // })
      } else {
        this.exit()
      }
    } else if (hasError.length > 0) {
      chalk.red(log(`Had problems connecting to ${hasError.length} nodes in the mesh!`))
      this.exit()
    } else {
      const nodesMsg = outOfDateNodes.length < sortedNodes.length ? outOfDateNodes.map(i => i.node).join(', ') : 'all nodes'
      const promptContinue = await cli.confirm(`Continue post installing for ${nodesMsg} (Y/n)`)
      if (promptContinue) {
        this.exit()
      /* Iterating nodes */
      //   await sortedNodes.forEach(async info => {
      //     /* Backup each node */
      //     console.log("START BY NODE", info.node, info.distance)
      //     const ssh = await connectToNode(info.node)
      //     console.log('Connected to', info.node)
      //     const backup = nodeBackup(ssh, info, dataDir)
      //     console.log("TCL: LimeUpdaterCommand -> run -> backup", backup)
      //     const doUpgrade = await upgrade(info.node)
      //     // console.log("TCL: LimeUpdaterCommand -> run -> doUpgrade", doUpgrade)
      //     // copy firmware according to model
      //     // putFile()
      //     // sysupgrade -n
      //     // wait
      //   })
      // }
      } else {
        this.exit()
      }
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
}

module.exports = LimeUpdaterCommand
