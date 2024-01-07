import { withToken, startPolling, on } from './index.ts'

@withToken(process.env.BOT_TOKEN)
class Bot {
    count: number = 0;

    @on.message()
    handleMessages(message: any) {
        console.log(`message count ${++this.count}`)
    }
}

let bot = new Bot()
bot.count++

startPolling(bot, { allowed_updates: ["message"] })
