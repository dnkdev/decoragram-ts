
type DecoragramAPI = {
    updateOffset: number,
    _events: Map<Function, EventDataType>
}

type EventDataType = {
    _updateType: string,
    _comparableObject?: any
    _errorHandler?: ErrorHandler,
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
 * @remarks `comparable` not type safe, but it suppose to converge with Telegram's Bot API structure of received update to work as filter.
 * */
export function on<T extends UpdateResponseObject>(updType: UpdateType, comparable?: Record<string, any>, errorHandler?: ErrorHandler) {
    return function (target: Handler<T>, _: ClassMethodDecoratorContext, desc?: PropertyDescriptor) {
        // @ts-ignore
        if (!target._events) {
            // @ts-ignore
            target._events = new Map<Function, EventDataType>();
        }

        let compObj: EventDataType = {
            _updateType: updType
        }
        if (comparable) {
            compObj._comparableObject = comparable
        }
        if (errorHandler) {
            compObj._errorHandler = errorHandler
        }
        // @ts-ignore
        target._events.set(desc?.value, compObj);
    }
}

export async function sendFormDataRequest(bot: any, apiMethod: string, data: any) {
    let toSend = new FormData();
    for (const key of Object.keys(data)) {
        // atm array of files is passed only in sendGroupMedia, will this changes is unknown, so it's good
        if (Array.isArray(data[key])) {
            for (let i = 0; i < data[key].length; i++) {
                if ('media' in data[key][i]) {
                    const name = data[key][i]['media'].name
                    toSend.append(name, data[key][i]['media'])
                    data[key][i]['media'] = 'attach://' + name
                }
                if ('thumbnail' in data[key][i]) {
                    const name = data[key][i]['thumbnail'].name + '-thumbnail'
                    toSend.append(name, data[key][i]['thumbnail'])
                    data[key][i]['thumbnail'] = 'attach://' + name
                }
            }
            toSend.append(key, JSON.stringify(data[key]))
        }
        else {
            toSend.append(key, data[key])
        }
    }

    return fetch(`https://api.telegram.org/bot${bot.token}/${apiMethod}`, {
        method: 'POST',
        body: toSend
    })
}

export async function sendRequest(bot: any, apiMethod: string, data: any) {
    return fetch(`https://api.telegram.org/bot${bot.token}/${apiMethod}`, {
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
    if (typeof compared == 'object' && typeof original == 'object') {
        const keys = Object.keys(compared)
        for (const key of keys) {
            if (key in original) {
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
    return true;
}

async function handleUpdate<T extends DecoragramAPI>(bot: T, update: any) {
    bot.updateOffset = update.update_id + 1
    bot._events.forEach((eventData, eventFunction) => {
        const updateType = eventData._updateType;
        if (updateType && updateType in update) {
            if (!objectsDeepConverge(update[updateType], eventData._comparableObject)) {
                return;
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
        const res: any = await (await sendRequest(bot, 'getUpdates', args)).json()
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
        setTimeout(pollHandlerFunc, 500)

    }
    setTimeout(pollHandlerFunc, 1)
}
