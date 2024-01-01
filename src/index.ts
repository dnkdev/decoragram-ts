
export class Dispatcher {
    messageHandlers: { [key: string]: Function };
    editedMessageHandlers: { [key: string]: Function };
    channelPostHandlers: { [key: string]: Function };
    editedChannelPostHandlers: { [key: string]: Function };
    messageReactionHandlers: Function[];
    messageReactionCountHandlers: Function[];
    inlineQueryHandlers: { [key: string]: Function };
    chosenInlineResultHandlers: { [key: string]: Function };
    callbackQueryHandlers: { [key: string]: Function };
    shippingQueryHandlers: { [key: string]: Function };
    preCheckoutQueryHandlers: { [key: string]: Function };
    pollHandlers: Function[];
    pollAnswerHandlers: Function[];
    myChatMemberHandlers: Function[];
    chatMemberHandlers: Function[];
    chatJoinRequestHandlers: Function[];
    chatBoostHandlers: Function[];
    removedChatBoostHandlers: Function[];
    token: string;
    pollingTimer: Timer | null;
    updateOffset: number;
    constructor(token?: string) {
        this.messageHandlers = {};
        this.editedMessageHandlers = {};
        this.channelPostHandlers = {};
        this.editedChannelPostHandlers = {};
        this.messageReactionHandlers = [];
        this.messageReactionCountHandlers = [];
        this.inlineQueryHandlers = {};
        this.chosenInlineResultHandlers = {};
        this.callbackQueryHandlers = {};
        this.shippingQueryHandlers = {};
        this.preCheckoutQueryHandlers = {};
        this.pollHandlers = [];
        this.pollAnswerHandlers = [];
        this.myChatMemberHandlers = [];
        this.chatMemberHandlers = [];
        this.chatJoinRequestHandlers = [];
        this.chatBoostHandlers = [];
        this.removedChatBoostHandlers = [];
        this.updateOffset = 0;
        this.pollingTimer = null;
        if (token !== undefined) {
            this.token = token
        }
        else {
            console.error('[ERROR] token not found.')
            this.token = ''
            process.exit(1)
        }
    }

    sendApiRequest = async (apiMethod: string, data: any) => {
        return await fetch(`https://api.telegram.org/bot${this.token}/${apiMethod}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json;charset=UTF-8',
            },
            body: JSON.stringify(data)
        })
    }
    message = (cmd: string) => {
        checkForDuplicates(cmd, this.messageHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.messageHandlers[cmd] = descriptor.value
        }
    }
    edited_message = (cmd: string) => {
        checkForDuplicates(cmd, this.editedMessageHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.editedMessageHandlers[cmd] = descriptor.value
        }
    }
    channel_post = (cmd: string) => {
        checkForDuplicates(cmd, this.channelPostHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.channelPostHandlers[cmd] = descriptor.value
        }
    }
    edited_channel_post = (cmd: string) => {
        checkForDuplicates(cmd, this.editedChannelPostHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.editedChannelPostHandlers[cmd] = descriptor.value
        }
    }
    message_reaction = () => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.messageReactionHandlers.push(descriptor.value)
        }
    }
    message_reaction_count = () => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.messageReactionCountHandlers.push(descriptor.value)
        }
    }
    inline_query = (cmd: string) => {
        checkForDuplicates(cmd, this.inlineQueryHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.inlineQueryHandlers[cmd] = descriptor.value
        }
    }
    chosen_inline_result = (cmd: string) => {
        checkForDuplicates(cmd, this.chosenInlineResultHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.chosenInlineResultHandlers[cmd] = descriptor.value
        }
    }
    callback_query = (cmd: string) => {
        checkForDuplicates(cmd, this.callbackQueryHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.callbackQueryHandlers[cmd] = descriptor.value
        }
    }
    shipping_query = (cmd: string) => {
        checkForDuplicates(cmd, this.shippingQueryHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.shippingQueryHandlers[cmd] = descriptor.value
        }
    }
    pre_checkout_query = (cmd: string) => {
        checkForDuplicates(cmd, this.preCheckoutQueryHandlers)
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.preCheckoutQueryHandlers[cmd] = descriptor.value
        }
    }
    poll = (cmd: string) => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.pollHandlers.push(descriptor.value)
        }
    }
    poll_answer = (cmd: string) => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.pollAnswerHandlers.push(descriptor.value)
        }
    }
    my_chat_member = (cmd: string) => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.myChatMemberHandlers.push(descriptor.value)
        }
    }
    chat_member = (cmd: string) => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.chatMemberHandlers.push(descriptor.value)
        }
    }
    chat_join_request = (cmd: string) => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.chatJoinRequestHandlers.push(descriptor.value)
        }
    }
    chat_boost = (cmd: string) => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.chatBoostHandlers.push(descriptor.value)
        }
    }
    removed_chat_boost = (cmd: string) => {
        return (target: any, property: string | symbol, descriptor: PropertyDescriptor) => {
            this.removedChatBoostHandlers.push(descriptor.value)
        }
    }


    startPolling = (params: any) => {
        console.log('Start polling....')
        if (!('timeout' in params)) {
            params.timeout = 10
        }
        const pollHandler = async () => {
            params.offset = this.updateOffset
            const res = await (await this.sendApiRequest('getUpdates', params)).json()
            if (res.ok) {
                if (res.result.length > 0) {
                    console.debug(`Got ${res.result.length} update(s).`)
                    res.result.forEach((update: any) => {
                        this.handleUpdate(update)
                    })
                }
            } else {
                console.error(`[ERROR] getUpdates ${res.error_code}: ${res.description}`)
            }
            pollHandler()
        }
        setTimeout(pollHandler, 1)
    }
    private handleUpdate(update: any): void {
        this.updateOffset = update.update_id + 1
        let cmd: string = '';
        if ('message' in update) {
            if ('text' in update.message) {
                cmd = update.message.text;
                if (this.messageHandlers.hasOwnProperty(cmd)) {
                    this.messageHandlers[cmd](update.message)
                }
            }
            else {
                console.warn('unhandled message type.')
            }
            return;
        }
        if ('edited_message' in update) {
            if ('text' in update.edited_message) {
                cmd = update.edited_message.text;
                this.editedMessageHandlers[cmd](update.edited_message)
            }
            else {
                console.warn('unhandled edited_message type.')
            }
            return;
        }
        if ('channel_post' in update) {
            if ('text' in update.channel_post) {
                cmd = update.channel_post.text
                this.channelPostHandlers[cmd](update.channel_post)
            }
            else {
                console.warn('unhandled channel_post type.')
            }
            return;
        }
        if ('edited_channel_post' in update) {
            if ('text' in update.edited_channel_post) {
                cmd = update.edited_channel_post.text
                this.channelPostHandlers[cmd](update.edited_channel_post)
            }
            else {
                console.warn('unhandled edited_channel_post type.')
            }
            return;
        }
        if ('message_reaction' in update) {
            this.messageReactionHandlers.forEach((h: Function) => h(update.message_reaction))
            return;
        }
        if ('message_reaction_count' in update) {
            this.messageReactionCountHandlers.forEach((h: Function) => h(update.message_reaction_count))
            return;
        }
        if ('inline_query' in update) {
            cmd = update.inline_query.query
            this.inlineQueryHandlers[cmd](update.inline_query)
            return;
        }
        if ('chosen_inline_result' in update) {
            cmd = update.chosen_inline_result.query
            this.chosenInlineResultHandlers[cmd](update.chosen_inline_result)
            return;
        }
        if ('callback_query' in update) {
            cmd = update.callback_query.data
            this.callbackQueryHandlers[cmd](update.callback_query)
            return;
        }
        if ('shipping_query' in update) {
            cmd = update.shipping_query.invoice_payload
            this.shippingQueryHandlers[cmd](update.shipping_query)
            return;
        }
        if ('pre_checkout_query' in update) {
            cmd = update.pre_checkout_query.invoice_payload
            this.preCheckoutQueryHandlers[cmd](update.pre_checkout_query)
            return;
        }
        if ('poll' in update) {
            this.pollHandlers.forEach((h: Function) => h(update.poll))
            return;
        }
        if ('poll_answer' in update) {
            this.pollAnswerHandlers.forEach((h: Function) => h(update.poll_answer))
            return;
        }
        if ('my_chat_member' in update) {
            this.myChatMemberHandlers.forEach((h: Function) => h(update.my_chat_member))
            return;
        }
        if ('chat_member' in update) {
            this.chatMemberHandlers.forEach((h: Function) => h(update.chat_member))
            return;
        }
        if ('chat_join_request' in update) {
            this.chatJoinRequestHandlers.forEach((h: Function) => h(update.chat_join_request))
            return;
        }
        if ('chat_boost' in update) {
            this.chatBoostHandlers.forEach((h: Function) => h(update.chat_boost))
            return;
        }
        if ('removed_chat_boost' in update) {
            this.removedChatBoostHandlers.forEach((h: Function) => h(update.removed_chat_boost))
            return;
        }
    }
}
function checkForDuplicates(cmd: string, instance: object): void {
    if (cmd in instance) {
        console.error(`[ERROR] handler property duplicate '${cmd}'`)
        process.exit(2)
    }
}