import { ShopState } from "./shop-state.js"

let socket

export function registerSocket() {

    socket = socketlib.registerModule("rufos-shopkeeper")

    socket.register("saveState", ShopState.saveStateAsGM)

}

export function getSocket() {

    return socket

}