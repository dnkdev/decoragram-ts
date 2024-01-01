import { Dispatcher } from './index.ts'

let app = new Dispatcher(process.env.BOT_TOKEN)
class Bot {
    @app.message('/start')
    func(message: object) {
        console.log("Hello!")
    }
    @app.message_reaction()
    react(o: object) {
        console.log('got reaction')
        console.log(o)
    }
    @app.message('/hello')
    @app.message('/hello2')
    hello() {
        console.log('Yes, Hello!')
    }
}
app.startPolling({
    allowed_updates: ["message", "message_reaction", "message_reaction_count"],
    timeout: 30
})
