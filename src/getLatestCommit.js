const fetch = require('node-fetch')


const latestCommitsUrl = 'https://api.github.com/repos/LibreRouterOrg/openwrt/commits'

module.exports = async () => {
  try {
    const res = await fetch(latestCommitsUrl)
    console.log("TCL: res", res)
    return res
  } catch (err) {
    throw err
  }
}

