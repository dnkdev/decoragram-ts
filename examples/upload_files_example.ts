import { withToken, startPolling, on, sendFormDataRequest } from '../src/index';

function errorHandler(data: any, err: any) {
    console.log('Error message:')
    console.log(err.message)
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
        { text: '/start' },
        errorHandler
    )
    handleMessage(message: any) {
        throw Error('Boo')
    }

    @on('message', { text: '/send' }, errorHandler)
    async sendDocument(message: any) {
        let res = await sendFormDataRequest(this, 'sendDocument', {
            chat_id: message.from.id,
            document: Bun.file('./doc.txt')
        })
    }

    @on('message', { text: '/media' }, errorHandler)
    async sendMedia(message: any) {
        let res = await sendFormDataRequest(this, 'sendMediaGroup', {
            chat_id: message.from.id,
            media: [
                {
                    type: 'document',
                    media: Bun.file('./doc.txt'),
                    thumbnail: Bun.file('./Female.jpg')
                },
                {
                    type: 'document',
                    media: Bun.file('./doc2.txt')
                }
            ]
        })
        console.log(await res.json())
    }
}
let bot = new Bot();
startPolling(bot, { 'allowed_updates': ['message'] })
