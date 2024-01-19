
type DecoragramAPI = {
    updateOffset: number,
    _events: Map<Function, any>
}

export type UpdateType = 'message'
    | 'channel_post'
    | 'inline_query'
    | 'chosen_inline_result'
    | 'callback_query'
    | 'message_reaction'
    | 'message_reaction_count'
    | 'shipping_query'
    | 'pre_checkout_query'
    | 'edited_message'
    | 'edited_channel_post'
    | 'poll'
    | 'poll_answer'
    | 'my_chat_member'
    | 'chat_member'
    | 'chat_join_request'
    | 'chat_boost'
    | 'removed_chat_boost'
    ;


type UpdateResponseObject = { [key: string | symbol]: any }
type Handler<T extends UpdateResponseObject> = (response: T, ...args: any[]) => void
type ErrorHandler = (updateData: any, err: any) => void


/** 
 * Main decorator for declaring a method which will handle specified type of update.
 * @param updType type of update
 * @param comparable "filter" object, if existed field doesn't converge with existed received update field, handler won't be called
 * @param errorHandler Function for catching throwed errors from update handler (catching throwed errors from your method which have `on` decorator)
 * */
export function on<T extends UpdateResponseObject>(updType: UpdateType, comparable?: Record<string, any>, errorHandler?: ErrorHandler) {
    return function (target: Handler<T>, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
        // @ts-ignore
        if (!target._events) {
            // @ts-ignore
            target._events = new Map<Function, any>();
        }
        comparable = comparable ?? {}
        comparable._updateType = updType;
        if (errorHandler) {
            comparable._errorHandler = errorHandler
        }
        // @ts-ignore
        target._events.set(desc?.value, comparable);
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
const objectsDeepConverge = (original: any, compared: any): boolean => {
    if (typeof original == 'object' && typeof compared == 'object') {
        const keys = Object.keys(original)
        for (const key of keys) {
            if (key in compared) {
                if (typeof compared[key] === "object") {
                    if (!objectsDeepConverge(original[key], compared[key])) {
                        return false;
                    }
                }
                else if (typeof compared[key] === "boolean") {
                    if (!compared[key] == Boolean(original[key])) {
                        return false;
                    }
                }
                else if (original[key] != compared[key]) {
                    return false;
                }
            }
        }
    }
    else {
        throw Error('objectDeepConverge received not object instance. Probably the `comparable` differs from Telegram Bot API data.')
    }
    return true;
}

async function handleUpdate<T extends DecoragramAPI>(bot: T, update: any) {
    bot.updateOffset = update.update_id + 1
    bot._events.forEach((eventData, eventFunction) => {
        const updateType = eventData._updateType;
        if (updateType && updateType in update) {
            const dataKeys = Object.keys(eventData)
            for (const eventCondKey of dataKeys) {
                if (eventCondKey in update[updateType]) {
                    const originalVal = update[updateType][eventCondKey]
                    const comparedVal = eventData[eventCondKey]
                    if (typeof comparedVal == "boolean") {
                        if (comparedVal != Boolean(originalVal)) {
                            return;
                        }
                    }
                    else if (typeof comparedVal == "object") {
                        if (!objectsDeepConverge(originalVal, comparedVal)) {
                            return;
                        }
                    }
                    else if (comparedVal != originalVal) {
                        return;
                    }
                }
            }
            if (!eventData._errorHandler) {
                return eventFunction.call(bot, update[updateType])
            }
            else {
                try {
                    return eventFunction.call(bot, update[updateType]);
                } catch (e) {
                    return eventData._errorHandler.call(bot, update[updateType], e)
                }
            }
        }
    })
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

    const args: Required<StartPollingArgs> = {
        timeout: pollingArgs?.timeout ?? 10,
        offset: pollingArgs?.offset ?? 0,
        limit: pollingArgs?.limit ?? 100,
        allowed_updates: pollingArgs?.allowed_updates ?? ['message']
    }

    const pollHandlerFunc = async () => {
        // console.log(args)
        args.offset = bot.updateOffset
        const res: any = await (await sendApiRequest(bot, 'getUpdates', args)).json()
        if (res.ok) {
            if (res.result.length > 0) {
                // console.debug(`Got ${res.result.length} update(s).`)
                for (const update of res.result) {
                    setTimeout(
                        handleUpdate, 0, bot, update
                    )
                }
            }
        } else {
            console.error(`[ERROR] getUpdates ${res.error_code}: ${res.description}`)
        }
        // console.dir(res)
        setTimeout(pollHandlerFunc, 500)

    }
    setTimeout(pollHandlerFunc, 1)
}
