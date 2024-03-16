const dotenv = require('dotenv')
dotenv.config()
const ethers = require('ethers');
const fetch = require('node-fetch');
const TelegramBot = require('node-telegram-bot-api');

const addresses = {
    factory: "0x4163103b32dACe52bc72A9E4FD77EC8403038143",
    // factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
}

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

const privateKey = process.env.PRIVATE_KEY;

const provider = new ethers.providers.WebSocketProvider(process.env.WEB_SOCKET_PROVIDER)
const wallet = new ethers.Wallet(privateKey);
const account = wallet.connect(provider)

const bot = new TelegramBot(telegramBotToken, { polling: true });

let chatIds = [];

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!chatIds.includes(chatId)) {
        chatIds.push(chatId);
        console.log(`Added new chat ID: ${chatId}`);
    }
});



const factory = new ethers.Contract(
    addresses.factory,
    ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
    account
);

factory.on("PairCreated", async (token0, token1, addressPair, timeStamp) => {
    const message = `New pair created: Token 0: ${token0} Token 1: ${token1} Pair Address: ${addressPair} at ${timeStamp} time`;
    console.log(message);

    await sendMessageToTelegram(message);

}
)

async function sendMessageToTelegram(message) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const headers = { 'Content-Type': 'application/json' };

    for (const chatId of chatIds) {
        const body = JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body
            });
            const data = await response.json();
            console.log(`Message sent to chat ID ${chatId}:`, data);
        } catch (error) {
            console.error(`Error sending message to chat ID ${chatId}:`, error);
        }
    }
}


// comment