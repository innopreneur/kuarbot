const axios = require("axios")


export async function sendMessage(message) {
    try {
        console.log(`Sending message :: 
        ${message}`)
        let response = await axios({
            url: process.env.NIMROD_API_URL,
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                "api_key": process.env.NIMROD_API_KEY,
                "message": message
            })
        })
        if (response.status == 200) {
            return response.data
        } else {
            throw new Error(response.status)
        }

    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

module.exports = { sendMessage }