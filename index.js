const { argv } = require('yargs')
const axios = require('axios')


const getQuestion = ({ cookie }) => {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const postOptions = { headers: { cookie, 'Content-Type': 'application/json' } }
  const postData = {
    variables: { year, month },
    operationName: 'dailyQuestionRecords',
    query: 'query dailyQuestionRecords($year: Int!, $month: Int!) {\n  dailyQuestionRecords(year: $year, month: $month) {\n    date\n    question {\n      questionId\n      questionTitleSlug\n      translatedTitle\n    }\n  }\n}\n'
  }

  return axios.post('https://leetcode-cn.com/graphql', postData, postOptions)
    .then(res => {
      const questions = res.data.data && res.data.data.dailyQuestionRecords
      const todayData = questions[0] || null
      console.log('todayData: ', todayData)
      if (!todayData) throw new Error(res.data)
      return todayData
    })
}


const sendWechatMsg = ({ question, hookUrl, chatid }) => {
  const { questionId, questionTitleSlug, translatedTitle } = question.question
  const questionUrl = `https://leetcode-cn.com/problems/${questionTitleSlug}/`
  const mdContent = `**Leetcode 每日一题 ${question.date}**\n[**#${questionId} ${translatedTitle}**](${questionUrl})`
  const wechatMsg = {
    chatid: argv.chatid || '',
    markdown: { content: mdContent },
    msgtype: "markdown",
  }

  return axios.post(hookUrl, wechatMsg)
    .then(res => {
      if (res.data && res.data.errcode !== 0) throw new Error(res.data)
      return res.data
    })
}


async function main () {
  const { cookie, hookUrl, chatid } = argv
  console.log('argv: ', argv)
  
  if (!cookie || !hookUrl || chatid === undefined) {
    console.error('params error', argv)
    return process.exit(1)
  } else {
    const question = await getQuestion({ cookie })
    await sendWechatMsg({ question, hookUrl, chatid })
    return process.exit(0)
  }
}
main()
