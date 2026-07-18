import { shopkeeperApplication } from "./application.js";

export let lojinha

export function abrirLoja() {
    lojinha = new shopkeeperApplication()
    lojinha.render(true)
}