// Testes do ShopState e do registro do socket, com "game", "foundry" e "socketlib" falsos.
import { describe, test, beforeEach, afterEach, mock } from "node:test"
import assert from "node:assert/strict"

import { ShopState } from "../scripts/shop-state.js"
import { registerSocket, getSocket } from "../scripts/socket.js"
import { criarParty } from "./helpers.js"

let atores

beforeEach(() => {
    atores = []
    // Versões mínimas do que o Foundry fornece e o módulo usa.
    globalThis.foundry = {
        utils: {
            deepClone: structuredClone,
            isEmpty: objeto => Object.keys(objeto).length === 0,
        },
    }
    globalThis.game = {
        user: { isGM: true },
        actors: { find: funcao => atores.find(funcao) },
    }
})

afterEach(() => mock.restoreAll())

describe("ShopState.getParty", () => {
    test("devolve a Party ativa, ignorando personagens e Parties inativas", () => {
        const ativa = criarParty()
        const inativa = { ...criarParty(), active: false }
        atores = [{ type: "character", active: true }, inativa, ativa]

        assert.equal(ShopState.getParty(), ativa)
    })

    test("sem Party ativa, devolve undefined", () => {
        atores = [{ type: "character", active: true }]
        assert.equal(ShopState.getParty(), undefined)
    })
})

describe("ShopState.getState", () => {
    test("sem nada salvo, devolve a estrutura vazia padrão", () => {
        atores = [criarParty({ lojinha: undefined })]
        assert.deepEqual(ShopState.getState(), { playersLoja: {}, itemsLoja: {} })
    })

    test("completa com o padrão o que faltar no que foi salvo", () => {
        atores = [criarParty({ lojinha: { itemsLoja: { k: { checked: true } } } })]
        assert.deepEqual(ShopState.getState(), { playersLoja: {}, itemsLoja: { k: { checked: true } } })
    })

    test("devolve uma cópia: alterar o resultado não mexe no que está salvo", () => {
        const lojinha = { itemsLoja: { k: { checked: true } } }
        atores = [criarParty({ lojinha })]

        const estado = ShopState.getState()
        estado.itemsLoja.k.checked = false

        assert.equal(lojinha.itemsLoja.k.checked, true)
    })
})

describe("ShopState.applyChangesAsGM", () => {
    test("grava cada mudança sob o caminho da flag do módulo", async () => {
        const party = criarParty()
        atores = [party]

        await ShopState.applyChangesAsGM({
            "itemsLoja.k": { checked: true, quantity: 1 },
            "playersLoja.a1": false,
        })

        assert.equal(party.update.mock.calls.length, 1)
        assert.deepEqual(party.update.mock.calls[0].arguments[0], {
            "flags.rufos-shopkeeper.lojinha.itemsLoja.k": { checked: true, quantity: 1 },
            "flags.rufos-shopkeeper.lojinha.playersLoja.a1": false,
        })
    })

    test("ignora caminhos fora de itemsLoja e playersLoja (proteção contra gravações indevidas)", async () => {
        const party = criarParty()
        atores = [party]

        await ShopState.applyChangesAsGM({
            "outraCoisa.x": 1,
            "itemsLoja.k": { checked: true },
        })

        assert.deepEqual(party.update.mock.calls[0].arguments[0], {
            "flags.rufos-shopkeeper.lojinha.itemsLoja.k": { checked: true },
        })
    })

    test("se nenhum caminho for válido, não grava nada", async () => {
        const party = criarParty()
        atores = [party]

        await ShopState.applyChangesAsGM({ "outraCoisa.x": 1 })
        await ShopState.applyChangesAsGM({})
        await ShopState.applyChangesAsGM(undefined)

        assert.equal(party.update.mock.calls.length, 0)
    })

    test("sem Party ativa, retorna sem erro", async () => {
        atores = []
        await assert.doesNotReject(ShopState.applyChangesAsGM({ "itemsLoja.k": 1 }))
    })
})

describe("ShopState.applyChanges e o socket", () => {
    test("registerSocket registra as duas funções do módulo no socketlib", () => {
        const registros = {}
        const socketFalso = { register: (nome, funcao) => { registros[nome] = funcao }, executeAsGM: mock.fn(async () => {}) }
        globalThis.socketlib = {
            registerModule: id => {
                assert.equal(id, "rufos-shopkeeper")
                return socketFalso
            },
        }

        registerSocket()

        assert.deepEqual(Object.keys(registros).sort(), ["applyChanges", "sellItems"])
        assert.equal(registros.applyChanges, ShopState.applyChangesAsGM)
        assert.equal(getSocket(), socketFalso)
    })

    test("o mestre grava direto, sem passar pelo socket", async () => {
        const party = criarParty()
        atores = [party]
        game.user.isGM = true

        await ShopState.applyChanges({ "playersLoja.a1": true })

        assert.equal(party.update.mock.calls.length, 1)
    })

    test("o jogador pede ao mestre pelo socket", async () => {
        const party = criarParty()
        atores = [party]
        game.user.isGM = false
        const mudancas = { "playersLoja.a1": true }

        await ShopState.applyChanges(mudancas)

        // getSocket() é o socket falso registrado no teste anterior
        const chamadas = getSocket().executeAsGM.mock.calls
        assert.equal(chamadas.length, 1)
        assert.deepEqual(chamadas[0].arguments, ["applyChanges", mudancas])
        assert.equal(party.update.mock.calls.length, 0)
    })
})

describe("atalhos de gravação", () => {
    test("setPlayerChecked grava a marca do jogador", async () => {
        const aplicar = mock.method(ShopState, "applyChanges", async () => {})

        await ShopState.setPlayerChecked("a1", false)

        assert.deepEqual(aplicar.mock.calls[0].arguments[0], { "playersLoja.a1": false })
    })

    test("marcar um item cria o registro com quantidade 1", async () => {
        const aplicar = mock.method(ShopState, "applyChanges", async () => {})

        await ShopState.setItemsChecked("Actor.a1.Item.i1", true)

        assert.deepEqual(aplicar.mock.calls[0].arguments[0], {
            "itemsLoja.Actor_a1_Item_i1": { checked: true, quantity: 1 },
        })
    })

    test("desmarcar um item apaga o registro", async () => {
        const aplicar = mock.method(ShopState, "applyChanges", async () => {})

        await ShopState.setItemsChecked("Actor.a1.Item.i1", false)

        assert.deepEqual(aplicar.mock.calls[0].arguments[0], {
            "itemsLoja.-=Actor_a1_Item_i1": null,
        })
    })

    test("alterar a quantidade de um item registrado grava só a quantidade", async () => {
        mock.method(ShopState, "getState", () => ({ itemsLoja: { Actor_a1_Item_i1: { checked: true, quantity: 1 } } }))
        const aplicar = mock.method(ShopState, "applyChanges", async () => {})

        await ShopState.setItemQuantity("Actor.a1.Item.i1", 4)

        assert.deepEqual(aplicar.mock.calls[0].arguments[0], {
            "itemsLoja.Actor_a1_Item_i1.quantity": 4,
        })
    })

    test("alterar a quantidade de um item que não está marcado não grava nada", async () => {
        mock.method(ShopState, "getState", () => ({ itemsLoja: {} }))
        const aplicar = mock.method(ShopState, "applyChanges", async () => {})

        await ShopState.setItemQuantity("Actor.a1.Item.i1", 4)

        assert.equal(aplicar.mock.calls.length, 0)
    })
})
