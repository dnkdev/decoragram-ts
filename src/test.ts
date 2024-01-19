import { withToken, startPolling, on } from './index';

type Message = {
    text: string
}

function errorHandler(data: any, err: any) {
    console.log('I\'m handling error!')
}

@withToken(process.env.BOT_TOKEN)
class Bot {
    state: number = 0;
    constructor() {
        this.state = 0;
    }


    @on(
        'message',
        {},
        errorHandler
    )
    handleMessage(message: Message) {
        console.log('hello handler ' + message.text)
        throw Error('Boo')
    }
}
let bot = new Bot();
startPolling(bot, { 'allowed_updates': ['message'] })
