import { withToken, startPolling, on } from '../src/index';

type Message = {
    text: string
}

function errorHandler(data: any, err: any) {
    console.log('Error is:')
    console.log(err)
    console.log('I\'m handling error!')
}

@withToken(process.env.BOT_TOKEN)
class Bot {
    state: number = 0;

    @on(
        'message',
        { text: '/start' },
        errorHandler
    )
    handleMessage(message: Message) {
        throw Error('Boo')
    }
}
let bot = new Bot();
startPolling(bot, { 'allowed_updates': ['message'] })
