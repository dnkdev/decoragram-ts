type DecoragramAPI = AllHandlers & {
    updateOffset: number
}
type AllHandlers = {
    messageHandlers: Function[];
    editedMessageHandlers: Function[];
    channelPostHandlers: Function[];
    editedChannelPostHandlers: Function[];
    messageReactionHandlers: Function[];
    messageReactionCountHandlers: Function[];
    inlineQueryHandlers: Function[];
    chosenInlineResultHandlers: Function[];
    callbackQueryHandlers: Function[];
    shippingQueryHandlers: Function[];
    preCheckoutQueryHandlers: Function[];
    pollHandlers: Function[];
    pollAnswerHandlers: Function[];
    myChatMemberHandlers: Function[];
    chatMemberHandlers: Function[];
    chatJoinRequestHandlers: Function[];
    chatBoostHandlers: Function[];
    removedChatBoostHandlers: Function[];
}

function handleUpdate<T extends DecoragramAPI>(bot: T, update: any) {
    console.log('HANDLING...')
    console.dir(update)
    bot.updateOffset = update.update_id + 1
    if ('message' in update) {
        bot.messageHandlers.forEach((h: Function) => h.call(bot, update.message))
    }
    if ('edited_message' in update) {
        bot.editedMessageHandlers.forEach((h: Function) => h.call(bot, update.edited_message))
        return;
    }
    if ('channel_post' in update) {
        bot.channelPostHandlers.forEach((h: Function) => h.call(bot, update.channel_post))
        return;
    }
    if ('edited_channel_post' in update) {
        bot.channelPostHandlers.forEach((h: Function) => h.call(bot, update.edited_channel_post))
        return;
    }
    if ('message_reaction' in update) {
        bot.messageReactionHandlers.forEach((h: Function) => h.call(bot, update.message_reaction))
        return;
    }
    if ('message_reaction_count' in update) {
        bot.messageReactionCountHandlers.forEach((h: Function) => h.call(bot, update.message_reaction_count))
        return;
    }
    if ('inline_query' in update) {
        bot.inlineQueryHandlers.forEach((h: Function) => h.call(bot, update.inline_query))
        return;
    }
    if ('chosen_inline_result' in update) {
        bot.chosenInlineResultHandlers.forEach((h: Function) => h.call(bot, update.chosen_inline_result))
        return;
    }
    if ('callback_query' in update) {
        bot.callbackQueryHandlers.forEach((h: Function) => h.call(bot, update.callback_query))
        return;
    }
    if ('shipping_query' in update) {
        bot.shippingQueryHandlers.forEach((h: Function) => h.call(bot, update.shipping_query))
        return;
    }
    if ('pre_checkout_query' in update) {
        bot.preCheckoutQueryHandlers.forEach((h: Function) => h.call(bot, update.pre_checkout_query))
        return;
    }
    if ('poll' in update) {
        bot.pollHandlers.forEach((h: Function) => h.call(bot, update.poll))
        return;
    }
    if ('poll_answer' in update) {
        bot.pollAnswerHandlers.forEach((h: Function) => h.call(bot, update.poll_answer))
        return;
    }
    if ('my_chat_member' in update) {
        bot.myChatMemberHandlers.forEach((h: Function) => h.call(bot, update.my_chat_member))
        return;
    }
    if ('chat_member' in update) {
        bot.chatMemberHandlers.forEach((h: Function) => h.call(bot, update.chat_member))
        return;
    }
    if ('chat_join_request' in update) {
        bot.chatJoinRequestHandlers.forEach((h: Function) => h.call(bot, update.chat_join_request))
        return;
    }
    if ('chat_boost' in update) {
        bot.chatBoostHandlers.forEach((h: Function) => h.call(bot, update.chat_boost))
        return;
    }
    if ('removed_chat_boost' in update) {
        bot.removedChatBoostHandlers.forEach((h: Function) => h.call(bot, update.removed_chat_boost))
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

type startPollingArgs = { timeout?: number, offset?: number, limit?: number, allowed_updates?: string[] }

export function startPolling(bot: any, args?: startPollingArgs) {
    if (!bot.token) {
        throw Error('field `token` value not found. Consider using a class decorator `@withToken(token)`')
    }
    console.log(`starting polling bot ${bot.token}`)
    const pollHandlerFunc = async () => {
        if (args) {
            args.offset = bot.updateOffset
        }
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
        console.dir(res)
        // pollHandlerFunc()
    }
    setTimeout(pollHandlerFunc, 1)

}
class Dispatcher {
    message = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.messageHandlers) {
                target.messageHandlers = []
            }
            target.messageHandlers.push(desc?.value)
        }
    }

    edited_message = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.editedMessageHandlers) {
                target.editedMessageHandlers = []
            }
            target.editedMessageHandlers.push(desc?.value)
        }
    }
    channel_post = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.channelPostHandlers) {
                target.channelPostHandlers = []
            }
            target.channelPostHandlers.push(desc?.value)
        }
    }
    edited_channel_post = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.editedChannelPostHandlers) {
                target.messageHandlers = []
            }
            target.editedChannelPostHandlers.push(desc?.value)
        }
    }
    message_reaction = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.messageReactionHandlers) {
                target.messageReactionHandlers = []
            }
            target.messageReactionHandlers.push(desc?.value)
        }
    }
    message_reaction_count = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.messageReactionCountHandlers) {
                target.messageReactionCountHandlers = []
            }
            target.messageReactionCountHandlers.push(desc?.value)
        }
    }
    inline_query = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.inlineQueryHandlers) {
                target.inlineQueryHandlers = []
            }
            target.inlineQueryHandlers.push(desc?.value)
        }
    }
    chosen_inline_result = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.chosenInlineResultHandlers) {
                target.chosenInlineResultHandlers = []
            }
            target.chosenInlineResultHandlers.push(desc?.value)
        }
    }
    callback_query = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.callbackQueryHandlers) {
                target.callbackQueryHandlers = []
            }
            target.callbackQueryHandlers.push(desc?.value)
        }
    }
    shipping_query = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.shippingQueryHandlers) {
                target.shippingQueryHandlers = []
            }
            target.shippingQueryHandlers.push(desc?.value)
        }
    }
    pre_checkout_query = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.preCheckoutQueryHandlers) {
                target.preCheckoutQueryHandlers = []
            }
            target.preCheckoutQueryHandlers.push(desc?.value)
        }
    }
    poll = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.pollHandlers) {
                target.pollHandlers = []
            }
            target.pollHandlers.push(desc?.value)
        }
    }
    poll_answer = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.pollAnswerHandlers) {
                target.pollAnswerHandlers = []
            }
            target.pollAnswerHandlers.push(desc?.value)
        }
    }
    my_chat_member = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.myChatMemberHandlers) {
                target.myChatMemberHandlers = []
            }
            target.myChatMemberHandlers.push(desc?.value)
        }
    }
    chat_member = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.chatMemberHandlers) {
                target.chatMemberHandlers = []
            }
            target.chatMemberHandlers.push(desc?.value)
        }
    }
    chat_join_request = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.chatJoinRequestHandlers) {
                target.chatJoinRequestHandlers = []
            }
            target.chatJoinRequestHandlers.push(desc?.value)
        }
    }
    chat_boost = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.chatBoostHandlers) {
                target.chatBoostHandlers = []
            }
            target.chatBoostHandlers.push(desc?.value)
        }
    }
    removed_chat_boost = () => {
        return function (target: any, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
            if (!target.removedChatBoostHandlers) {
                target.removedChatBoostHandlers = []
            }
            target.removedChatBoostHandlers.push(desc?.value)
        }
    }
}
/**
 * Decorators for methods which will handle specific update
 */
export var on = new Dispatcher()
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