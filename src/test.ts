import { withToken, startPolling, on, MessageType } from './index.ts'

@withToken(process.env.BOT_TOKEN)
class Bot {
    count: number = 0;

    @on(MessageType.text)
    handleMessages1(message: any) {
        console.log(`message1 count ${++this.count}`)
        if (message.text == '/start') {
            console.log(`start from ${message.from.username}`)
        }
    }

    // @on.message()
    // async handleMessages2(message: any) {
    //     console.log(`message2 count ${++this.count}`)
    //     if (message.text == '/start') {
    //         console.log(`start from ${message.from.username}`)
    //     }
    // }

    // @on.message()
    // async handleMessages(message: any) {
    //     console.log(`message3 count ${++this.count}`)
    //     if (message.text == '/start') {
    //         console.log(`start from ${message.from.username}`)
    //     }
    // }
}

let bot = new Bot()
bot.count++

startPolling(bot, { timeout: 11, allowed_updates: ["message"] })