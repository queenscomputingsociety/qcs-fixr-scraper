const fs = require("fs");
const fse = require("fs-extra")
const puppeteer = require("puppeteer");
const path = require("path")
const { sheetsv2 } = require("./sheets2");
const config = require("../config")

const getAdditionalQuestions = async () => {

    const sheet = await sheetsv2();

    console.log(`[AQ] Getting references from Google Sheets`);
    const googleData = await sheet.getRows();
    let references = googleData.map(row => row["reference"])
    console.log(`[AQ] Found ${references.length} existing entries`)

    console.log(`[AQ] Loading attendees from FIXR`)
    let json = fs.readFileSync(`${config.downloadDir}/output.json`)
    json = JSON.parse(json).data;
    console.log(`[AQ] Loaded ${json.length} attendees`)

    const attendeesToGet = json.filter(e => !references.includes(e.reference_id))
    console.log(`[AQ] ${attendeesToGet.length} new attendees`)

    const refsToGet = attendeesToGet.map(e => e.reference_id)

    const questions = await getQuestions();
    const attendeeData = await fetchData(refsToGet);

    let answeredQuestions = []

    for (let i = 0; i < attendeesToGet.length; i++) {
        const attendee = attendeesToGet[i];

        if (attendeeData[i].length === 0) {
            console.log(`[AQ] Error - No data available (${attendee.reference_id}) `)
            continue;
        }

        answeredQuestions.push({
            reference: attendee.reference_id, answers: attendeeData[i].map(answer => {
                return {
                    question: questions.find(q => q.id === answer.question_id).question,
                    answer: answer.answer
                }
            })
        })


    }


    return { users: attendeesToGet, answers: answeredQuestions }

}

const fetchData = async refsToGet => {
    console.log("[AQ Answers] Starting browser instance");

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://organiser.fixr.co");
    await page.waitForSelector("input[type='email']")
    console.log("[AQ Answers] Logging in");
    await page.click("input[type='email']");
    await page.keyboard.type(config.email);
    await page.click("input[type='password']");
    await page.keyboard.type(config.password);
    await page.click("button[type='submit']");

    await page.waitForNetworkIdle();

    let data = []
    let responded = []
    for (let i = 0; i < refsToGet.length; i++) {

        page.on('response', async (response) => {
            if (response.request().method() !== 'GET') {
                return
              }
            if (responded.includes(refsToGet[i])) {
                console.log("Duplicate resp detected... Skipping")
                return
            }
            else {
                responded.push(refsToGet[i])
                try {
                    const json = await JSON.parse(await response.buffer())
                    data.push(json.data)
                } catch (e) {
                    console.log(e);
                    console.log(`[AQ Answers] Error - Invalid reference given ${refsToGet[i]}`)
                    data.push([])
                }
            }

        });
        console.log(`[AQ Answers] Getting reference ${i + 1} of ${refsToGet.length}`);
        await page.goto(
            `https://api.fixr.co/api/v2/organiser/accounts/${config.accountId}/events/${config.eventId}/additional-answers?reference_id=${refsToGet[i]}`
        );

    }

    console.log("[AQ Answers] Got all supporting data, closing browser");



    await new Promise((resolve) => {
        setTimeout(resolve, 5000);
    });

    await browser.close()
    console.log("[AQ Answers] Returning...");
    return data;

}

const getQuestions = async () => {
    console.log("[AQ Questions] Starting browser instance");

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://organiser.fixr.co");
    await page.waitForSelector("input[type='email']")
    console.log("[AQ Questions] Logging in");
    await page.click("input[type='email']");
    await page.keyboard.type(config.email);
    await page.click("input[type='password']");
    await page.keyboard.type(config.password);
    await page.click("button[type='submit']");

    await page.waitForNetworkIdle();


    page.on('response', async (response) => {
    
        if (response.request().method() !== 'GET') {
            return
          }

        let filePath = path.resolve(`./${config.downloadDir}/questions.json`);
        await fse.outputFile(filePath, await response.buffer());
        await browser.close();
    });
    console.log("[AQ Questions] Getting questions...");
    await page.goto(
        `https://api.fixr.co/api/v2/organiser/accounts/${config.accountId}/events/${config.eventId}/additional-questions`
    );
    console.log("[AQ Questions] Done getting questions");
    console.log("[AQ Questions] Parsing JSON");

    let check = 0;
    let json = "";
    while (true) {
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
        check += 1;
        if (check > 100) {
            console.log("[AQ Questions] Took too long to open file")
            break;
        }
        try {

            json = JSON.parse(fs.readFileSync(`${config.downloadDir}/questions.json`))
            break;
        }
        catch {
            continue;
        }

    }
    console.log("[AQ Questions] Returning...");
    return json.data.map(e => { return { id: e.id, question: e.question_text.toLowerCase() } });
}

module.exports = { getAdditionalQuestions }