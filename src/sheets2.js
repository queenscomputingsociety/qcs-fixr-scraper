const { GoogleSpreadsheet } = require("google-spreadsheet");
const googleCredentials = require("../google-credentials.json");
const config = require("../config");
require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });

const sheetsv2 = async () => {
    console.log("[GSv2] Starting Sheets")
    console.log(`[GSv2] Authenticating...`);
    const doc = new GoogleSpreadsheet(config.sheetId);
    await doc.useServiceAccountAuth(googleCredentials);
    await doc.loadInfo();
    let sheet = undefined;

    try {
        console.log(`[GSv2] Attemping to create sheet...`);
        sheet = await doc.addSheet({
            headerValues: [

                "reference",
                "first_name",
                "last_name",
                "fixr_email",
                "date_of_birth",
                "full name (as registered with qub)",
                "year group",
                "university email address (yourname@qub.ac.uk)",
                "discord username (if you have one)",
                "minecraft ign (again, if you have one, and only for the java version of the game)",
                "qub student number",
            ],
            title: "Raw data (do not edit)",
        });
    } catch {
        console.log(`[GSv2] Sheet exists... Using that instead`);
        sheet = await doc.sheetsByTitle["Raw data (do not edit)"];
    }
    return sheet


}

module.exports = { sheetsv2 }