const mergeUsersAndAnswers = (users, answers) => {

    console.log("[MAU] Checking data")

    if (users.length !== answers.length) {

        console.log(`[MAU] WARN - Length mismatch (Users:${users.length}, Answers: ${answers.length}`)
        // return []
    }


    let combined = []

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const useranswers = answers[i];
        let x =
        {
            reference: user.reference_id,
            first_name: user.first_name,
            last_name: user.last_name,
            fixr_email: user.email,
            date_of_birth: user.date_of_birth

        }

        for (let j = 0; j < useranswers.answers.length; j++) {
            const answer = useranswers.answers[j];
            x[answer.question] = answer.answer

        }
        combined.push(x)
    }
    return combined

}

module.exports = { mergeUsersAndAnswers }