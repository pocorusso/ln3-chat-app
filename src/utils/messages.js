const generateMessage = (username, text) => {
    return {
        username: username,
        text: text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, lat, lng) => {
    return {
        username: username,
        url: `https://google.com/maps?q=${lat},${lng}`,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}