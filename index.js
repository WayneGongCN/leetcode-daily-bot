const { argv } = require("yargs");
const axios = require("axios");
const LEETCODE_URL = "https://leetcode-cn.com";

/**
 * Get leetcode today question
 */
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
    .post(`${LEETCODE_URL}/graphql`, postData, postOptions)
    .then((res) => {
      const todayRecord = res.data.data && res.data.data.todayRecord;
      const todayData = todayRecord[0] || null;
      if (!todayData) throw new Error(JSON.stringify(res.data));
      return todayData;
    });
};

/**
 * Send workwechat message
 * @param {*} param0
 */
const sendWechatMsg = ({ todayData, hookUrl, chatid }) => {
  const { questionFrontendId, questionTitleSlug } = todayData.question;
  const questionUrl = `${LEETCODE_URL}/problems/${questionTitleSlug}/`;
  const mdContent = `Leetcode 每日一题 ${todayData.date} [#${questionFrontendId} ${questionTitleSlug}](${questionUrl})`;
  const wechatMsg = {
    chatid,
    markdown: { content: mdContent },
    msgtype: "markdown",
  };

  return axios.post(hookUrl, wechatMsg).then((res) => {
    if (res.data && res.data.errcode !== 0)
      throw new Error(JSON.stringify(res.data));
    return res.data;
  });
};

(async ({ hookUrl, chatid }) => {
  if (!hookUrl || !chatid) {
    console.error("PARAMS_ERROR\n", { hookUrl, chatid });
    return process.exit(1);
  }

  const todayData = await getQuestion().catch((e) =>
    console.error("GET_QUESTION_ERROR\n", e)
  );
  if (!todayData) return process.exit(1);
  console.log("GET_QUESTION_SUCCESS");

  await sendWechatMsg({ todayData, hookUrl, chatid })
    .then((res) => {
      console.log("SEND_MESSAGE_SUCCESS");
      process.exit(0);
    })
    .catch((e) => {
      console.error("SEND_MESSAGE_ERROR\n", e);
      process.exit(1);
    });
})(argv);
