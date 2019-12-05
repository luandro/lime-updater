const homedir = require('os').homedir()
const appDir = `${homedir}/.libremesh`
const mkdirp = require('mkdirp')

module.exports = async (node, dataDir) => {
  try {
    // const interface = ubus call lime-openairview get_interfaces -> [0].name
    // const mac = ubus call network.device status "{ 'name':'wlan0-mesh'}" -> macaddr
    const nodeDir = `${dataDir || appDir}/${node}`
    await mkdirp.sync(nodeDir)
    return nodeDir
  } catch (error) {
    throw error
  }
}
