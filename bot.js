import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import * as dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const url = "https://render-test-xooq.onrender.com";

async function getAllWords() {
  console.log("батя тут, тестим");
  const data = await fetch(`${url}/api/all`, { method: "get" });
  const dataJson = (await data.json()).data;

  const textPreps = Object.keys(dataJson).map((word) => {
    return `${dataJson[word].en} - ${dataJson[word].ru}`;
  });
  return textPreps.join("\n");
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
bot.hears("hi", (ctx) => ctx.reply("hello there"));
bot.hears("Показать все слова", async (ctx) => {
  const data = await getAllWords();
  ctx.reply(data);
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
