import EventEmitter from 'node:events'

type DecoragramAPI = {
    updateOffset: number,
    ee: EventEmitter
}

type UpdateTypes = [
    'message'
    , 'edited_message'
    , 'channel_post'
    , 'edited_channel_post'
    , 'message_reaction'
    , 'message_reaction_count'
    , 'inline_query'
    , 'chosen_inline_result'
    , 'callback_query'
    , 'shipping_query'
    , 'pre_checkout_query'
    , 'poll'
    , 'poll_answer'
    , 'my_chat_member'
    , 'chat_member'
    , 'chat_join_request'
    , 'chat_boost'
    , 'removed_chat_boost'
];
async function handleUpdate<T extends DecoragramAPI>(bot: T, update: any) {
    // console.log('HANDLING...')
    // console.dir(update)
    bot.updateOffset = update.update_id + 1
    for (const handler of ['message', 'channel_post', 'edited_message', 'edited_channel_post']) {
        if (handler in update) {
            for (const val of Object.keys(MessageType).filter(k => isNaN(Number(k)))) {
                if (val in update.message) {
                    bot.ee.emit(handler + '-' + val, bot, update.message)
                }
            }
            return;
        }
    }
    if ('message_reaction' in update) {
        return;
    }
    if ('message_reaction_count' in update) {
        return;
    }
    if ('inline_query' in update) {
        return;
    }
    if ('chosen_inline_result' in update) {
        return;
    }
    if ('callback_query' in update) {
        return;
    }
    if ('shipping_query' in update) {
        return;
    }
    if ('pre_checkout_query' in update) {
        return;
    }
    if ('poll' in update) {
        return;
    }
    if ('poll_answer' in update) {
        return;
    }
    if ('my_chat_member' in update) {
        return;
    }
    if ('chat_member' in update) {
        return;
    }
    if ('chat_join_request' in update) {
        return;
    }
    if ('chat_boost' in update) {
        return;
    }
    if ('removed_chat_boost' in update) {
        return;
    }
}

export async function sendApiRequest(bot: any, apiMethod: string, data: any) {
    return await fetch(`https://api.telegram.org/bot${bot.token}/${apiMethod}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(data)
    })
}
/**
 * Class Decorator. Literally ads a property `token` to a class. Through a decorator though.
 */
export function withToken(token?: string) {
    return function <T extends { new(...args: any[]): any }>(target: T, context: ClassDecoratorContext): T {
        return class extends target {
            token = token;
            constructor(...args: any[]) {
                super(...args);
            }
        }
    }
}
type StartPollingArgs = { timeout?: number, offset?: number, limit?: number, allowed_updates?: string[] }

export function startPolling(bot: any, pollingArgs?: StartPollingArgs) {
    if (!bot.token) {
        throw Error('field `token` value not found. Consider using a class decorator `@withToken(token)`')
    }
    if (!bot.updateOffset) {
        bot.updateOffset = 0
    }
    console.log(`Start polling updates...`)

    let args: Required<StartPollingArgs> = {
        timeout: pollingArgs?.timeout ?? 10,
        offset: pollingArgs?.offset ?? 0,
        limit: pollingArgs?.limit ?? 100,
        allowed_updates: pollingArgs?.allowed_updates ?? ['message']
    }

    bot.updateOffset = bot.updateOffset ?? 0
    const pollHandlerFunc = async () => {
        // console.log(args)
        args.offset = bot.updateOffset
        const res = await (await sendApiRequest(bot, 'getUpdates', args)).json()
        if (res.ok) {
            if (res.result.length > 0) {
                console.debug(`Got ${res.result.length} update(s).`)
                res.result.forEach((update: any) => {
                    handleUpdate(bot, update)
                })
            }
        } else {
            console.error(`[ERROR] getUpdates ${res.error_code}: ${res.description}`)
        }
        // console.dir(res)
        setTimeout(pollHandlerFunc, 500)

    }
    setTimeout(pollHandlerFunc, 1)
}
export enum MessageType {
    text = 1 << 0,
    animation = 1 << 1,
    audio = 1 << 2,
    document = 1 << 3,
    photo = 1 << 4,
    sticker = 1 << 5,
    story = 1 << 6,
    video = 1 << 7,
    video_note = 1 << 8,
    voice = 1 << 9,
    caption = 1 << 10,
    contact = 1 << 11,
    dice = 1 << 12,
    game = 1 << 13,
    poll = 1 << 14,
    venue = 1 << 15,
    location = 1 << 16,
    // all = text | animation | audio | document | photo | sticker | story | video | video_note | voice | caption | contact | dice | game | poll | venue | location
}

type MessageOptions = {
    //'text | audio' | 'animation' | 'audio' | 'document' | 'photo' | 'sticker' | 'story' | 'video' | 'video_note' | 'voice' | 'caption' | 'contact' | 'dice' | 'game' | 'poll' | 'venue' | 'location'
    is?: string,
    startsWith?: string
    contains?: string
    middleware?: any
}

export var on = (type: MessageType) => {
    return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
        let listener = (t: any, data: any) => {
            desc?.value.call(t, data)
        }

        if (!target.ee) {
            target.ee = new EventEmitter()
        }

        for (const val of Object.keys(MessageType).filter(k => isNaN(Number(k)))) {
            if (type & MessageType[val as keyof typeof MessageType]) {
                target.ee.on('message-' + val, listener)
            }
        }
        console.log('registered and ready to mingle')
        // target.ee.on('message', listener)
    }
}

// class Dispatcher {

//     message = (type: MessageType, options?: MessageOptions) => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             let listener = (t: any, message: any) => {
//                 console.log('HELLO FROM MESSAGE')
//                 desc?.value.call(t, message)
//             }

//             if (!target.ee) {
//                 target.ee = new EventEmitter()
//             }
//             // let a = MessageType['text']
//             // console.log(type & a)
//             // if (type & MessageType.text) {
//             //     target.ee.on('message-text', listener)
//             // }
//             for (const val of Object.keys(MessageType).filter(k => isNaN(Number(k)))) {
//                 if (type & MessageType[val as keyof typeof MessageType]) {
//                     console.log('yes ' + val)
//                 }
//             }

//             target.ee.on('message', listener)
//         }
//     }

//     edited_message = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.editedMessageHandlers) {
//                 target.editedMessageHandlers = []
//             }
//             target.editedMessageHandlers.push(desc?.value)
//         }
//     }
//     channel_post = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.channelPostHandlers) {
//                 target.channelPostHandlers = []
//             }
//             target.channelPostHandlers.push(desc?.value)
//         }
//     }
//     edited_channel_post = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.editedChannelPostHandlers) {
//                 target.messageHandlers = []
//             }
//             target.editedChannelPostHandlers.push(desc?.value)
//         }
//     }
//     message_reaction = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.messageReactionHandlers) {
//                 target.messageReactionHandlers = []
//             }
//             target.messageReactionHandlers.push(desc?.value)
//         }
//     }
//     message_reaction_count = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.messageReactionCountHandlers) {
//                 target.messageReactionCountHandlers = []
//             }
//             target.messageReactionCountHandlers.push(desc?.value)
//         }
//     }
//     inline_query = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.inlineQueryHandlers) {
//                 target.inlineQueryHandlers = []
//             }
//             target.inlineQueryHandlers.push(desc?.value)
//         }
//     }
//     chosen_inline_result = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.chosenInlineResultHandlers) {
//                 target.chosenInlineResultHandlers = []
//             }
//             target.chosenInlineResultHandlers.push(desc?.value)
//         }
//     }
//     callback_query = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.callbackQueryHandlers) {
//                 target.callbackQueryHandlers = []
//             }
//             target.callbackQueryHandlers.push(desc?.value)
//         }
//     }
//     shipping_query = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.shippingQueryHandlers) {
//                 target.shippingQueryHandlers = []
//             }
//             target.shippingQueryHandlers.push(desc?.value)
//         }
//     }
//     pre_checkout_query = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.preCheckoutQueryHandlers) {
//                 target.preCheckoutQueryHandlers = []
//             }
//             target.preCheckoutQueryHandlers.push(desc?.value)
//         }
//     }
//     poll = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.pollHandlers) {
//                 target.pollHandlers = []
//             }
//             target.pollHandlers.push(desc?.value)
//         }
//     }
//     poll_answer = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.pollAnswerHandlers) {
//                 target.pollAnswerHandlers = []
//             }
//             target.pollAnswerHandlers.push(desc?.value)
//         }
//     }
//     my_chat_member = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.myChatMemberHandlers) {
//                 target.myChatMemberHandlers = []
//             }
//             target.myChatMemberHandlers.push(desc?.value)
//         }
//     }
//     chat_member = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.chatMemberHandlers) {
//                 target.chatMemberHandlers = []
//             }
//             target.chatMemberHandlers.push(desc?.value)
//         }
//     }
//     chat_join_request = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.chatJoinRequestHandlers) {
//                 target.chatJoinRequestHandlers = []
//             }
//             target.chatJoinRequestHandlers.push(desc?.value)
//         }
//     }
//     chat_boost = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.chatBoostHandlers) {
//                 target.chatBoostHandlers = []
//             }
//             target.chatBoostHandlers.push(desc?.value)
//         }
//     }
//     removed_chat_boost = () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.removedChatBoostHandlers) {
//                 target.removedChatBoostHandlers = []
//             }
//             target.removedChatBoostHandlers.push(desc?.value)
//         }
//     }
// }
/**
 * Decorators for methods which will handle specific update
 */
// export var on = new Dispatcher()


// export var on = {
//     message: () => {
//         return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
//             if (!target.messageHandlers) {
//                 target.messageHandlers = []
//             }
//             target.messageHandlers.push(
//                 desc?.value
//             )
//         }
//     }
// }