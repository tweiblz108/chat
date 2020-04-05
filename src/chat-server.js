const fs = require('fs')
const app = require('https').createServer({
	key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/mewsq.xyz.key'),
	ca: [fs.readFileSync('/opt/bitnami/letsencrypt/certificates/mewsq.xyz.issuer.crt')],
	cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/mewsq.xyz.crt')
})
const io = require('socket.io')(app)

const port = 38008

// /opt/bitnami/letsencrypt/certificates

app.listen(port)

const Gang = {

}

console.log(`listen on ${port}`)

io.on('connection', function (socket) {
  socket.on('login', function(id) {
    console.log(`${id} log in`)

    socket.emit('friends', Object.keys(Gang))

    Gang[id] = { socket }
  })

  socket.on('send-ice-candidate', function ({targetId, sourceId, candidate}) {
    const { socket:targetSocket } = Gang[targetId]
    
    targetSocket.emit('recv-ice-candidate', {sourceId, candidate})
  })

  socket.on('send-video-answer', function ({sourceId, targetId, sdp}) {
    const {socket: targetSocket} = Gang[targetId]

    targetSocket.emit('recv-video-answer', {sourceId, sdp})
  })

  socket.on('send-video-offer', function ({sourceId, targetId, sdp}) {
    const { socket: targetSocket } = Gang[targetId]

    targetSocket.emit('recv-video-offer', {sourceId, sdp})
  })
})