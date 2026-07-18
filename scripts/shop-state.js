import { getSocket } from "./socket.js"

export class ShopState {

    static getParty() {

        return game.actors.find(actor => actor.type === "party" && actor.active)

    }

    static getState() {

        const party = ShopState.getParty()

        return foundry.utils.deepClone(
            party.getFlag("rufos-shopkeeper", "lojinha")
        ) ?? {
            playersLoja: {},
            itemsLoja: {

            },
        }

    }

    static async saveStateAsGM(loja) {

        const party = ShopState.getParty()

        await party.unsetFlag("rufos-shopkeeper", "lojinha");
        await party.setFlag("rufos-shopkeeper", "lojinha", loja);


    }

    static async saveState(loja) {

        const party = ShopState.getParty()

        if (game.user.isGM) {
            return ShopState.saveStateAsGM(loja)
        } else {
            const socket = getSocket()
            await socket.executeAsGM("saveState", loja)
        }

    }

    static async setPlayerChecked(actorId, checked) {

        const loja = ShopState.getState()

        loja.playersLoja[actorId] = checked

        await ShopState.saveState(loja)

    }

    static async setItemsChecked(itemUuid, checked) {

        const mercado = ShopState.getState()

        const key = itemUuid.replaceAll(".", "_")

        if (checked) {
            mercado.itemsLoja[key] = {
                checked: true,
                quantity: 1
            }
        } else {
            delete mercado.itemsLoja[key]
        }

        await ShopState.saveState(mercado)

    }

    static async setItemQuantity(itemUuid, quantity) {

        const loja = ShopState.getState()

        const key = itemUuid.replaceAll(".", "_")

        if (!loja.itemsLoja[key]) return

        loja.itemsLoja[key].quantity = quantity

        await ShopState.saveState(loja)

    }

}