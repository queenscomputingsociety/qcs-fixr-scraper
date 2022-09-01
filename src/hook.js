const { getAdditionalQuestions } = require("./getAdditionalQuestions");
const { mergeUsersAndAnswers } = require("./mergeUsersAndAnswers");

const hook = async () => {
    const { users, answers } = await getAdditionalQuestions();
    return mergeUsersAndAnswers(users, answers)



}
module.exports = { hook }