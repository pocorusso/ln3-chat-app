const socket = io()

//elements
const msgForm = document.querySelector('#message-form')
const msgFormInput = msgForm.querySelector('input')
const msgFormButton = msgForm.querySelector('button')
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        locationUrl: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    console.log(room)
    console.log(users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    console.log(html)
    document.querySelector('#sidebar').innerHTML = html
})

msgForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const msg = e.target.elements.message.value
    if (msg.length < 1) { return }

    msgFormButton.setAttribute('disabled', 'disabled')


    socket.emit('sendMessage', msg, (error) => {
        msgFormButton.removeAttribute('disabled')
        msgFormInput.value = ''
        msgFormInput.focus()

        if (error) {
            return console.log(error)
        }
    })
})

const sendLocationButton = document.querySelector('#send-location')
sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser")
    }

    sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        socket.emit('sendLocation', {
            lat: lat,
            lng: lng
        }, (message) => {
            sendLocationButton.removeAttribute('disabled')
            console.log("Location delivered:" + message.message)
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        console.log('Failed to join:' + error)
        alert(error) 
        location.href = '/'
    } 
})

