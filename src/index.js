const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')

const waitFor = require('./wait-for')
const getMeshNodes = require('./get-mesh-nodes')
const connectToNode = require('./connect-to-node')
const log = console.log
const clear = console.clear
const getlatestRevision = require('./get-latest-revision')
const getRoutes = require('./get-routes')
const printNodesTable = require('./print-nodes-table')
const nodeBackup = require('./node-backup')
const upgrade = require('./upgrade')
const nodeConfig = require('./node-config')

class LimeUpdaterCommand extends Command {
  async run() {
    const {flags} = this.parse(LimeUpdaterCommand)
    const postInstall = flags.post_install
    clear()
    log('Welcome, lets start by getting your mesh information')
    const latestRevision = await getlatestRevision()
    if (latestRevision) log('Latest LibreMesh revision:', latestRevision)
    const thisNodeSsh = await connectToNode('thisnode.info')
    const {nodes, hostname} = await getMeshNodes(thisNodeSsh)
    const sortedNodes = await getRoutes(nodes, hostname)
    const outOfDateNodes = sortedNodes.filter(i => i.board.release.version !== latestRevision)
    clear()
    printNodesTable(sortedNodes, latestRevision)
    if (!postInstall && outOfDateNodes.length === 0) {
      log('Great job, everything up to date!')
    } else if (postInstall) {
      const promptContinue = await cli.confirm('Continue post installing nodes? (Y/n)')
      if (promptContinue) {
        clear()
        await sortedNodes.forEach(async info => {
          const ssh = await connectToNode(info.node)
          const config = await nodeConfig(ssh, info)
          console.log("TCL: LimeUpdaterCommand -> run -> config", config)
        })
      }
    } else {
      const promptContinue = await cli.prompt('Continue upgrading nodes?')
      console.log("TCL: LimeUpdaterCommand -> run -> promptContinue", promptContinue)
      /* Iterating nodes */
      await sortedNodes.forEach(async info => {
        console.log("START BY NODE", info.node, info.distance)
        const ssh = await connectToNode(info.node)
        console.log('Connected to', info.node)
        const backup = nodeBackup(ssh, info)
        console.log("TCL: LimeUpdaterCommand -> run -> backup", backup)
        const doUpgrade = await upgrade(info.node)
        // console.log("TCL: LimeUpdaterCommand -> run -> doUpgrade", doUpgrade)
        // copy firmware according to model
        // putFile()
        // sysupgrade -n
        // wait
      })
    }
    /* Example */
    // this.log(`hello ${name} from ./src/index.js`)
    // await waitFor(3)
    // console.clear()
    // this.log(`hello again ${name} from ./src/index.js`)
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
  post_install: flags.boolean({char: 'p', default: false, description: 'only run post install, copying files and setting configs to the nodes'}),
}

module.exports = LimeUpdaterCommand
