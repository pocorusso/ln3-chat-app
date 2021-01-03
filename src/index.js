const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {
  generateMessage,
  generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000 // TODO Refactor the enviroment 

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, "../public")
// const viewsPath = path.join(__dirname, '../templates/views')
// const partialsPath = path.join(__dirname, '../templates/partials')

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

let count = 0
io.on('connection', (socket) => {
  console.log('New socket connection')

  // dont need it now, send only in a room instead
  // socket.emit('message', generateMessage('Welcome')) //to one particular connection
  // socket.broadcast.emit('message', generateMessage('New user has joined')) // to everyone except self

  socket.on('join', (options, callback) => { //options = {username, room}
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)
    socket.emit('message', generateMessage('Admin', 'Welcome!')) //to one particular connection
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`)) // to everyone except self

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()
  })

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter()
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed.')
    }

    const user = getUser(socket.id)
    if(!user) return callback({error: 'User not found'})

    io.to(user.room).emit('message', generateMessage(user.username, message)) //to everyone
    callback('Delievered')
  })

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id)
    if(!user) return callback({error: 'User not found'})

    io.to(user.room).emit('locationMessage',
      generateLocationMessage(user.username, location.lat, location.lng))
    callback({message: 'Location delievered'})
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log(`Listening at ${port}`)
})