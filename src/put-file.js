const scp = require('scp')

module.exports = async (host, localFile, remoteFile) => new Promise(resolve => {
  const options = {
    file: localFile,
    user: 'root',
    host: host,
    port: '22',
    path: remoteFile,
  }
  scp.send(options, error => {
    if (error) resolve({
      error: JSON.parse(JSON.stringify(error)).cmd,
    })
    else resolve(true)
  })
})
