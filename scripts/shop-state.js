import { getSocket } from "./socket.js"

const CAMINHO_FLAG = "flags.rufos-shopkeeper.lojinha"

export class ShopState {

    static getParty() {

        return game.actors.find(actor => actor.type === "party" && actor.active)

    }

    static getState() {

        const party = ShopState.getParty()

        return {
            playersLoja: {},
            itemsLoja: {},
            ...foundry.utils.deepClone(party.getFlag("rufos-shopkeeper", "lojinha") ?? {})
        }

    }

    static async applyChangesAsGM(changes) {

        const party = ShopState.getParty()

        if (!party) return

        const updates = {}

        for (const [caminho, valor] of Object.entries(changes ?? {})) {

            if (!caminho.startsWith("itemsLoja.") && !caminho.startsWith("playersLoja.")) continue

            updates[`${CAMINHO_FLAG}.${caminho}`] = valor

        }

        if (foundry.utils.isEmpty(updates)) return

        await party.update(updates)

    }

    static async applyChanges(changes) {

        if (game.user.isGM) {
            return ShopState.applyChangesAsGM(changes)
        } else {
            const socket = getSocket()
            await socket.executeAsGM("applyChanges", changes)
        }

    }

    static async setPlayerChecked(actorId, checked) {

        await ShopState.applyChanges({
            [`playersLoja.${actorId}`]: checked
        })

    }

    static async setItemsChecked(itemUuid, checked) {

        const key = itemUuid.replaceAll(".", "_")

        if (checked) {
            await ShopState.applyChanges({
                [`itemsLoja.${key}`]: { checked: true, quantity: 1 }
            })
        } else {
            await ShopState.applyChanges({
                [`itemsLoja.-=${key}`]: null
            })
        }

    }

    static async setItemQuantity(itemUuid, quantity) {

        const loja = ShopState.getState()

        const key = itemUuid.replaceAll(".", "_")

        if (!loja.itemsLoja[key]) return

        await ShopState.applyChanges({
            [`itemsLoja.${key}.quantity`]: quantity
        })

    }

}