const { argv } = require("yargs");
const axios = require("axios");

const getQuestion = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const postOptions = {
    headers: { "Content-Type": "application/json" },
  };
  const postData = {
    variables: {},
    operationName: "questionOfToday",
    query:
      "query questionOfToday {\n  todayRecord {\n    question {\n      questionFrontendId\n      questionTitleSlug\n      __typename\n    }\n    lastSubmission {\n      id\n      __typename\n    }\n    date\n    userStatus\n    __typename\n  }\n}\n",
  };

  return axios
    .post("https://leetcode-cn.com/graphql", postData, postOptions)
    .then((res) => {
      const todayRecord = res.data.data && res.data.data.todayRecord;
      const todayData = todayRecord[0] || null;
      if (!todayData) throw new Error(JSON.stringify(res.data));
      return todayData;
    });
};

const sendWechatMsg = ({ question: todayData, hookUrl, chatid }) => {
  const { questionFrontendId, questionTitleSlug } = todayData.question;
  const questionUrl = `https://leetcode-cn.com/problems/${questionTitleSlug}/`;
  const mdContent = `**Leetcode 每日一题 ${todayData.date} [#${questionFrontendId}](${questionUrl})**\n[**${questionTitleSlug}**](${questionUrl})`;
  const wechatMsg = {
    chatid: argv.chatid || "",
    markdown: { content: mdContent },
    msgtype: "markdown",
  };

  return axios.post(hookUrl, wechatMsg).then((res) => {
    if (res.data && res.data.errcode !== 0)
      throw new Error(JSON.stringify(res.data));
    return res.data;
  });
};

async function main() {
  const { hookUrl, chatid } = argv;
  console.log("argv: ", argv);

  if (!hookUrl || !chatid) {
    console.error("params error", argv);
    return process.exit(1);
  } else {
    const todayData = await getQuestion().catch(console.error);
    console.log("todayData: ", todayData);
    if (!todayData) return process.exit(1);

    await sendWechatMsg({ question: todayData, hookUrl, chatid })
      .then(console.log)
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
  }
}
main();
