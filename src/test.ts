import { withToken, startPolling, on } from './index'

@withToken(process.env.BOT_TOKEN)
class Bot {
    state: number = 0;
    constructor() {
        this.state = 0;
    }
    @on('message', { text: true, from: { is_bot: false }, chat: { type: 'private' } })
    handleMessage() {
        console.log('hello handler')
    }
}
let bot = new Bot();
startPolling(bot, { 'allowed_updates': ['message'] })
