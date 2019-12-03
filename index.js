const node_ssh = require('node-ssh')
const fs = require('fs')
const mkdirp = require('mkdirp')
const thisNodeSsh = new node_ssh()
const homedir = require('os').homedir()
const appDir = `${homedir}/.libremesh`

const getMeshNodes = async () => {
  try {
    const getHostName = await thisNodeSsh.execCommand('echo $HOSTNAME')
    const getNodes = await thisNodeSsh.execCommand('ubus call lime-utils get_cloud_nodes')
    if (getNodes.stderr) {
      throw ('STDERR: ' + getNodes.stderr)
    }
    if (getHostName.stderr) {
      throw ('STDERR: ' + getHostName.stderr)
    }
    const { nodes } = JSON.parse(getNodes.stdout)
    const hostname = getHostName.stdout
    return {
      nodes,
      hostname
    }
  } catch (err) {
    throw err
  }
}

const traceRouteToNode = async (node) => {
  let route = {
    node,
    distance: -1
  }
  try {
    await thisNodeSsh.exec('batctl', ['tr', node], {
      async onStdout(chunk) {
        const data = chunk.toString('utf8')
        if (data.includes('_dummy0')) {
          try {
            await data.split('\n').forEach(async (output) => {
              if (output.length > 1) {
                const info = await output.split(' ')
                const distance = await parseInt(info[1].split(':')[0])
                if (!route.distance || distance > route.distance) {
                  route.distance = distance
                }
              }
            })
          } catch (err) {
            console.log("TCL: onStdout -~~~~~~> err", err)
          }
        }
      },
      onStderr(chunk) {
        console.log('stderrChunk ================> ', chunk.toString('utf8'))
      },
    })
    return route
  } catch (err) {
    console.log("TCL: err", err)
    return route
  }
}

async function execute (ssh, command) {
  const exec = await ssh.execCommand(command)
  if (exec.stderr) {
    throw ('STDERR: ' + exec.stderr)
  }
  return exec.stdout
}

async function backupFile (ssh, remoteFile, locaFile) {
  const getFile = await execute(ssh, `cat ${remoteFile}`)
  await fs.writeFileSync(locaFile, getFile)
}

async function putFile (ssh, locaFile, remoteFile) {
  ssh.putFile(localFile, remoteFile).then(()  => {
    console.log("The File thing is done")
  }, (error) => {
    console.log("Something's wrong")
    console.log(error)
  })
}

async function run () {
  console.log('Hello, lets start by getting some information about the nodes in the mesh')
  try {
    await thisNodeSsh.connect({
      host: 'thisnode.info',
      username: 'root',
      privateKey: '/home/luandro/.ssh/id_rsa'
    })
    const { nodes, hostname } = await getMeshNodes()
    // {
    //   [node]: [{
    //     node,
    //     distance
    //   }]
    // }
    const routes = await Promise.all(nodes.map(async node => {
      let route = {}
      if (node !== hostname) {
        route = await traceRouteToNode(node)
      } else {
        route = {
          node: hostname,
          distance: 0
        }
      }
      const ssh = new node_ssh()
      await ssh.connect({
        host: node,
        username: 'root',
        privateKey: '/home/luandro/.ssh/id_rsa'
      })
      console.log('Connected to', node)
      // get ipv6
      // get model
      const getBoardInfo = await ssh.execCommand('ubus call system board')
      if (getBoardInfo.stderr) {
        throw ('STDERR: ' + getBoardInfo.stderr)
      }
      const boardInfo = JSON.parse(getBoardInfo.stdout)
      route.board = boardInfo
      // save config/lime
      const nodeDir = `${appDir}/${node}`
      await mkdirp.sync(nodeDir)
      await backupFile(ssh, '/etc/config/lime', `${nodeDir}/lime`)
      // save config/pirania
      await backupFile(ssh, '/etc/config/pirania', `${nodeDir}/pirania`)
      // save config/dropbear
      await backupFile(ssh, '/etc/config/dropbear', `${nodeDir}/dropbear`)
      // save pirania db.csv
      const dbPath = await execute(ssh, 'uci get pirania.base_config.db_path')
      await backupFile(ssh, dbPath, `${nodeDir}/db.csv`)
      // save know_hosts
      await backupFile(ssh, '/etc/dropbear/authorized_keys', `${nodeDir}/authorized_keys`)
      return route
    }))
    const sortedRoutes = routes.sort((a, b) => b.distance-a.distance)
    console.log('Backup complete')
    console.log('Lets start updating from the most distant nodes')
    await sortedRoutes.forEach(async (nodeInfo) => {
      console.log("START BY NODE", nodeInfo.node, nodeInfo.distance)
      // copy firmware according to model
      putFile()
      // sysupgrade -n
      // wait 
    })
    // put lime config
    // put pirania config
    // put dropbear config
    // lime-config && lime-apply
    // put pirania db.csv
    // put authorized_keys
    // remove first_run
    // set password
  } catch (err) {
    console.log('Error ------>', err)
  }
}

run()