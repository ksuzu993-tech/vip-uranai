const express = require("express");
const line = require("@line/bot-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const lineConfig = {
  channelSecret: LINE_CHANNEL_SECRET,
  channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new line.Client(lineConfig);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// GitHub PagesのURL
const VIP_PAGE_URL = "https://ksuzu993-tech.github.io/vip-uranai/";

// 会話履歴管理
const conversationHistory = new Map();

function getHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  return conversationHistory.get(userId);
}

function addToHistory(userId, role, text) {
  const history = getHistory(userId);
  history.push({ role, parts: [{ text }] });
  if (history.length > 10) history.shift();
}

// Gemini AI応答
async function generateAIResponse(userId, userMessage) {
  try {
    const history = getHistory(userId);
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "あなたはBrain購入者向けの占いプロンプト案内アシスタントです。親切丁寧に、占いプロンプトの使い方や特典についてサポートしてください。" }]
        },
        {
          role: "model",
          parts: [{ text: "承知しました！占いプロンプトの案内アシスタントとしてお手伝いします😊" }]
        },
        ...history,
      ],
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    });
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();
    addToHistory(userId, "user", userMessage);
    addToHistory(userId, "model", response);
    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "申し訳ございません、現在システムエラーが発生しています。しばらく経ってから再度お試しください🙏";
  }
}

// キーワード処理
function getKeywordResponse(text) {
  const t = text.trim();

  // 特典・VIPページ案内
  if (t === "特典" || t === "とくてん" || t === "レビュー特典") {
    return `🎁 VIP特典をお届けします！\n\n✨ 占いMODシステム（購入者限定）\n→ ${VIP_PAGE_URL}\n\n好きな占いベースにMODを重ねて、あなただけのオリジナル占いAIを作れます🔮\n\n※このURLは購入者限定です。第三者への共有はご遠慮ください。`;
  }

  // 使い方
  if (t === "使い方" || t === "つかいかた" || t === "ヘルプ" || t === "help") {
    return `📖 使い方ガイドです！\n\n【特典ページの使い方】\n①「特典」と送るとVIPページのURLが届きます\n②ページで占いベース（9種）を選ぶ\n③MOD（15種）を重ねてカスタマイズ\n④プロンプトをコピーしてGeminiのGemに貼り付け\n⑤Gemに話しかけると鑑定スタート✨\n\n【キーワード一覧】\n🎁「特典」→ VIPページURL\n📖「使い方」→ このガイド\n🔮「占い一覧」→ 占いの種類\n❓「質問」→ AIが回答`;
  }

  // 占い一覧
  if (t === "占い一覧" || t === "占いの種類" || t === "うらない") {
    return `🔮 使える占いベース一覧です！\n\n⭐ 西洋占星術\n🃏 タロット占い\n🔢 数秘術\n🀄 四柱推命\n🧭 九星気学\n🏮 風水\n🩸 血液型占い\n🐾 動物占い\n🌟 オラクルカード\n\nそれぞれに15種類のMODを重ねられます✨\n詳しくはVIPページをご覧ください！\n→ ${VIP_PAGE_URL}`;
  }

  // MOD一覧
  if (t === "MOD" || t === "mod" || t === "モッド" || t === "MOD一覧") {
    return `✨ 使えるMOD一覧です！\n\n💔 復縁・元カレMOD\n🌹 不倫・複雑恋愛MOD\n💍 結婚・婚期MOD\n🌸 片思い成就MOD\n👫 夫婦・パートナーMOD\n🔥 ツインレイMOD\n💹 副業・起業開運MOD\n🎯 転職・天職MOD\n✨ 引き寄せの法則MOD\n🔮 前世・カルマMOD\n🌿 毒親・家族問題MOD\n🌙 HSP・繊細さんMOD\n💜 推し活・縁結びMOD\n📅 開運日・タイミングMOD\n💭 夢診断・潜在意識MOD\n\n複数重ねて使えます🎉`;
  }

  return null;
}

// メッセージイベント処理
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    if (event.type === "follow") {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `友達追加ありがとうございます🎉\nすずきBrainの占いプロンプト特典Bot です🔮\n\n「特典」と送ると\nVIP限定の占いMODシステムのURLをお届けします✨\n\n「使い方」と送るとガイドが見られます📖`,
      });
    }
    return;
  }

  const userMessage = event.message.text;
  const userId = event.source.userId;

  console.log(`[${new Date().toISOString()}] User: ${userId} | Message: ${userMessage}`);

  // キーワード判定
  const keywordResponse = getKeywordResponse(userMessage);
  if (keywordResponse) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: keywordResponse,
    });
  }

  // AI応答
  const aiResponse = await generateAIResponse(userId, userMessage);
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: aiResponse,
  });
}

// Expressサーバー
const app = express();

app.post("/webhook", line.middleware(lineConfig), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ status: "ok" }))
    .catch((err) => {
      console.error("Webhook Error:", err);
      res.status(500).end();
    });
});

app.get("/", (req, res) => res.send("すずきBrain LINE Bot 稼働中🔮"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LINE Bot server running on port ${PORT}`);
});
