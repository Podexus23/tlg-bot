import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import * as dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(
  session({
    defaultSession: () => ({
      waitingForData: false,
      quiz: false,
      quizData: [],
    }),
  })
);
const url = "https://render-test-xooq.onrender.com";
// const url = "http://127.0.0.1:3000";

async function getAllWords() {
  console.log("батя тут, тестим");
  const data = await fetch(`${url}/api/all`, { method: "get" });
  const dataJson = (await data.json()).data;

  const textPreps = Object.keys(dataJson).map((word) => {
    return `${dataJson[word].en} - ${dataJson[word].ru}`;
  });
  return textPreps.join("\n");
}

async function sendNewWord(str) {
  const words = str.split("-").map((e) => e.trim());
  if (words.length < 2) {
    console.error("wrong data");
    return;
  }
  const data = { en_word: words[0], ru_word: words[1] };
  console.log(data);
  await fetch(`${url}/api/word`, {
    method: "post",
    body: JSON.stringify(data),
  });
}

async function quizPrep(data) {
  const words = data.map((word) => word.ru).join(", ");
  return words;
}

async function checkQuiz(answerStr, ctx) {
  const quizData = ctx.session.quizData;
  const answers = answerStr.split(",").map((e) => e.trim());
  let result = 0;
  const res = quizData.map((word, i) => {
    const { en, ru } = word;
    const check = en === answers[i];
    result = check ? (result += 1) : result;
    return `${ru} - ${answers[i]} ${check ? `✅` : `❌(${en})`}`;
  });
  return `${res.join("\n")}\nResult: ${result}/${quizData.length}`;
}

//реагирует на слеш /команда

bot.start((ctx) => ctx.reply("Welcome"));
bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.command("duck", (ctx) => {
  ctx.reply("pizdack");
});

//реагирует на сообщение с определенным контентом
bot.on(message("sticker"), (ctx) => ctx.reply("👍"));

//реагирует на определенные текстовые сообщения
bot.hears("Показать все слова", async (ctx) => {
  const data = await getAllWords();
  ctx.reply(data);
});

bot.hears("Квиз", async (ctx) => {
  const data = await fetch(`${url}/api/quiz`, { method: "get" });
  const jsonData = (await data.json()).data;
  ctx.session.quizData = jsonData;
  ctx.session.quiz = true;
  ctx.reply(
    `напиши эти слова на английском, через запятую\n${await quizPrep(jsonData)}`
  );
});

bot.hears("Добавить слово", async (ctx) => {
  ctx.session.waitingForData = true;
  ctx.reply("Напиши слово и перевод в формате:\n cat - кот");
});

bot.on(message("text"), async (ctx, next) => {
  if (ctx.session.waitingForData) {
    const data = ctx.update.message.text;
    await sendNewWord(data);
    ctx.session.waitingForData = false;
    ctx.reply(`Слово ${data} добавлено, спасибо`);
  } else if (ctx.session.quiz) {
    const data = ctx.update.message.text;
    const res = await checkQuiz(data, ctx);
    ctx.session.waitingForData = false;
    ctx.reply(res);
  } else {
    next();
  }
});

bot.hears("Заебись", async (ctx) => {
  ctx.reply("Спасибо шеф, 🫡");
});

//отрабатывает если ничего выше не прехватило

bot.use(async (ctx) => {
  await ctx.reply(
    "Что нужно сделать?",
    Markup.keyboard([["Показать все слова", "Добавить слово", "Квиз"]]).resize()
  );
});

bot.launch(() => {
  console.log("Bot is working");
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
