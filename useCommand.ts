import { debounce } from 'lodash'

type TCommandHook = {
    listenKeyboard: boolean
}

type TCommandQueue = {
    commandName?: string,
    redo: () => void
    undo: () => void,
}

type TCommand = {
    commandName: string,
    pushQueueFlag: Boolean,
    execute: (data?: any) => TCommandQueue
}

type TState = {
    currentCommandIndex: number
    commandQueue: TCommandQueue[],
    commandMap: Record<string, (data?: any) => void>,
    listenKeyboardFlag: boolean
};

const KeycodeMap: Record<number, string> = {
    90: 'z', // undo
    89: 'y', // redo操作
    67: 'c', // 复制操作
    86: 'v', // 粘贴操作
};

enum CommandOperation {
    WIN_UNDO = "ctrl+z",
    WIN_REDO = "ctrl+y",
}



export const useCommand = (commandHookParam?: TCommandHook) => {
    const state: TState = {
        currentCommandIndex: 0, // 当前执行索引
        commandQueue: [], // 执行队列
        commandMap: {}, // 注册函数映射表
        listenKeyboardFlag: false
    }

    // 注册事件
    const registerCommand = (command: TCommand): void => {
        state.commandMap[command.commandName] = async (param: any) => {
            const { redo, undo } = command.execute(param)

            // 执行redo
            await redo()

            // 判断是否要放入队列
            if (!command.pushQueueFlag) return

            if (state.commandQueue.length > 0) {
                // 在撤销的过程中，遇到新操作，直接截取 0 - 下标的队列
                state.commandQueue = state.commandQueue.slice(0, state.currentCommandIndex + 1);
            };

            state.commandQueue.push({ commandName: command.commandName, redo, undo });
            state.currentCommandIndex = state.commandQueue.length - 1
        }
    }

    const redo = async (): Promise<void> => {
        const func = state.commandQueue?.[state.currentCommandIndex + 1];
        if (func) {
            await func.redo()
            state.currentCommandIndex++
        }
    }

    const undo = async (): Promise<void> => {
        if (state.currentCommandIndex < 0) return
        const func = state.commandQueue?.[state.currentCommandIndex]
        if (func) {
            await func.undo()
            state.currentCommandIndex--
        }
    }

    const keydown = (e: any) => {
        if (!state.listenKeyboardFlag) return
        const { metaKey, keyCode } = e;
        if (!metaKey) return
        const combinationKeycode = metaKey && `ctrl+${KeycodeMap[keyCode]}`
        switch (combinationKeycode) {
            case CommandOperation.WIN_UNDO:
                undo();
                break
            case CommandOperation.WIN_REDO:
                redo();
                break
        }

    }

    // 暂停键盘监听
    const updateKeyboardListenState = (flag: boolean): void => {
        state.listenKeyboardFlag = flag
    }

    const _OnmountedCommand = (commandHookParam?: TCommandHook): void => {
        if (commandHookParam?.listenKeyboard) {
            state.listenKeyboardFlag = commandHookParam.listenKeyboard
            window.addEventListener('keydown', debounce(keydown, 500));
        }
    }

    const unmountedCommand = (): void => {
        window.addEventListener('keydown', debounce(keydown, 500));
        state.commandMap = {}
        state.commandQueue = []
    }

    _OnmountedCommand(commandHookParam)

    return {
        state,
        undo,
        redo,
        registerCommand,
        updateKeyboardListenState,
        unmountedCommand
    }

}
