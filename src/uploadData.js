const { sheetsv2 } = require("./sheets2")

const uploadData = async data => {
    console.log(`[UD] Starting, uploading ${data.length} rows`)
    const sheet = await sheetsv2()
    
    await sheet.addRows(data)
    console.log(`[UD] Done!`)

}

module.exports = {uploadData}