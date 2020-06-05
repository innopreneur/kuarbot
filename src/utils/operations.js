// remove exisiting trading pair
export function removeById(id) {
    let item = id.split('-')

    switch (item[0]) {
        case 'pair':
            let actionIdWithPair = Object.keys(global.actions).filter(actionId => {
                global.actions[actionId].pair == id
            })

            // if pair is active in another action
            if (actionIdWithPair) {
                return { code: 500, message: `pair - ${id} is active in action [${actionIdWithPair}]` }
            }

            delete global.pairs[id]
            if (global.pairs[id]) {
                return { code: 500, message: `couldn't remove pair - ${id}` }
            }
            break

        case 'action':
            let tradeflowIdWithAction = Object.keys(global.tradeflows).filter(tradeflowId => {
                global.tradeflows[tradeflowId].actions.includes(id)
            })

            // if action is active in another tradeflow
            if (tradeflowIdWithAction) {
                return { code: 500, message: `action - ${id} is active in tradeflow [${tradeflowIdWithAction}]` }
            }

            delete global.actions[id]
            if (global.actions[id]) {
                return { code: 500, message: `couldn't remove action - ${id}` }
            }
            break

        case 'tradeflow':
            delete global.tradeflows[id]
            if (global.tradeflows[id]) {
                return { code: 500, message: `couldn't remove tradeflow - ${id}` }
            }
            break
    }

    return { code: 200, message: `Item with id [${id}] removed successfully` }

}