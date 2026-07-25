import { ShopState } from "./shop-state.js"
import { venderItens } from "./padaria.js"

let socket

export function registerSocket() {

    socket = socketlib.registerModule("rufos-shopkeeper")

    socket.register("saveState", ShopState.saveStateAsGM)
    socket.register("sellItems", venderItens)

}

export function getSocket() {

    return socket

}

