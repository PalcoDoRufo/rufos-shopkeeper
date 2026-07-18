import { abrirLoja, lojinha } from "./scene-control.js"
import { registerSocket } from "./socket.js";

export function hooksIntro() {

    Hooks.once("init", () => {
        console.log("Rufo's Shopkeeper | O atendente chegou à loja.")
    })

    Hooks.once("setup", () => {
        console.log("Rufo's Shopkeeper | O atendente organizou as mercadorias.")
    })

    Hooks.once("ready", () => {
        console.log("Rufo's Shopkeeper | O atendente abriu a loja!")
        ui.notifications.info("O atendente abriu a loja.", { LIFETIME_MS: 3000 })
    })

}

export function hookSocket() {

    Hooks.once("socketlib.ready", () => {
        registerSocket()
        console.log("Socketlib carregado.")
    })

}

export function hookSynchro() {

    let renderTimeout;

    Hooks.on("updateActor", (actor, changes) => {
        if (actor.type !== "party") return;
        if (!lojinha) return;

        if (!foundry.utils.hasProperty(
            changes,
            "flags.rufos-shopkeeper.lojinha"
        )) return;

        clearTimeout(renderTimeout);

        renderTimeout = setTimeout(() => {
            if (lojinha.rendered) {
                lojinha.render();
            }
        }, 0);
    });

}

export function hookLoja() {

    Hooks.on("getSceneControlButtons", controls => {
        controls.notes.tools.rufos_shopkeeper = {
            name: "rufos_shopkeeper",
            title: "Rufo's Shopkeeper",
            icon: "fa-solid fa-skull",
            order: Object.keys(controls.notes.tools).length,
            button: true,
            visible: true,
            onChange: abrirLoja
        }
    })
}