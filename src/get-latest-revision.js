const fetch = require('node-fetch')
const feedConfFile = 'https://raw.githubusercontent.com/LibreRouterOrg/openwrt/librerouter-18.06/feeds.conf.default'
const limePackages = 'https://github.com/libremesh/lime-packages.git'

module.exports = async () => {
  try {
    const res = await fetch(feedConfFile)
    const text = await res.text()
    let rev = null
    await text.split('\n').forEach(async output => {
      if (output.includes(limePackages)) {
        rev = output.split('^')[1]
      }
    })
    return rev
  } catch (error) {
    return null
  }
}

