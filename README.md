# js-ts-undo-redo-hook

# initialize hook 
const {
    state: commandState,
    undo,
    redo,
    registerCommand
} = useCommand({ listenKeyboard: true })

# register functions
registerCommand({
        commandName: "functionName",
        pushQueueFlag: true,
        execute: (param: any) => {
            return {
                redo: () => {
                    // execute function
                },
                undo: () => {
                    // execute function
                }
            }
        }
    })
