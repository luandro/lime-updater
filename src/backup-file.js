const scp = require('scp')

module.exports = async (host, remoteFile, localFile) => new Promise(resolve => {
  const options = {
    file: remoteFile,
    user: 'root',
    host: host,
    port: '22',
    path: localFile,
  }
  scp.get(options, error => {
    if (error) resolve({
      error: JSON.parse(JSON.stringify(error)).cmd,
    })
    else resolve(true)
  })
})
