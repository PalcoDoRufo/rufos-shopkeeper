// Testes do fluxo completo de venderItens(), usando objetos falsos no lugar do Foundry.
// Aqui verificamos as DECISÕES do fluxo (quando cancela, quando avisa, quando paga),
// não o comportamento real do Foundry.
import { describe, test, beforeEach, afterEach, mock } from "node:test"
import assert from "node:assert/strict"

import { venderItens } from "../scripts/padaria.js"
import { ShopState } from "../scripts/shop-state.js"
import { criarItem, criarAtor, criarParty, marcarItens } from "./helpers.js"

let aplicarMudancas

beforeEach(() => {
    // "ui" é uma variável global que só existe dentro do Foundry.
    globalThis.ui = { notifications: { warn: mock.fn(), error: mock.fn() } }
    mock.method(console, "log", () => {})
    mock.method(console, "error", () => {})
    aplicarMudancas = mock.method(ShopState, "applyChanges", async () => {})
})

afterEach(() => mock.restoreAll())

// Liga a Party falsa ao ShopState.
function usarParty(party, playersLoja = {}) {
    mock.method(ShopState, "getParty", () => party)
    mock.method(ShopState, "getState", () => ({ playersLoja, itemsLoja: {} }))
}

// Cenário padrão: dois jogadores, cada um com um item marcado.
//   itemA: equipamento de 200 cp -> vale 100 cp na venda
//   itemB: tesouro de 100 cp     -> vale 100 cp na venda
function cenarioPadrao() {
    const itemA = criarItem({ uuid: "Actor.a1.Item.A", name: "Espada", type: "equipment", copper: 200 })
    const itemB = criarItem({ uuid: "Actor.a2.Item.B", name: "Gema", type: "treasure", copper: 100 })
    const ator1 = criarAtor({ id: "a1", name: "Aria", itens: [itemA] })
    const ator2 = criarAtor({ id: "a2", name: "Borin", itens: [itemB] })
    const party = criarParty({
        membros: [ator1, ator2],
        lojinha: { itemsLoja: marcarItens([itemA, itemB]) },
    })
    return { itemA, itemB, ator1, ator2, party }
}

describe("venderItens", () => {
    test("não faz nada quando não há itens marcados", async () => {
        const ator1 = criarAtor({ id: "a1" })
        usarParty(criarParty({ membros: [ator1], lojinha: undefined }))

        await venderItens()

        assert.equal(ator1.inventory.addCoins.mock.calls.length, 0)
        assert.equal(ui.notifications.warn.mock.calls.length, 0)
    })

    test("cancela com aviso quando nenhum jogador está marcado para receber", async () => {
        const { itemA, itemB, ator1, ator2, party } = cenarioPadrao()
        usarParty(party, { a1: false, a2: false })

        await venderItens()

        assert.equal(ui.notifications.warn.mock.calls.length, 1)
        assert.match(ui.notifications.warn.mock.calls[0].arguments[0], /Nenhum jogador marcado/)
        assert.equal(itemA.apagado, false)
        assert.equal(itemB.apagado, false)
        assert.equal(ator1.inventory.addCoins.mock.calls.length, 0)
        assert.equal(ator2.inventory.addCoins.mock.calls.length, 0)
    })

    test("vende, divide o valor igualmente e limpa as marcas", async () => {
        const { itemA, itemB, ator1, ator2, party } = cenarioPadrao()
        usarParty(party)

        await venderItens()

        // total = 100 + 100 = 200 cp; para 2 jogadores = 100 cp (1 gp) cada
        for (const ator of [ator1, ator2]) {
            assert.equal(ator.inventory.addCoins.mock.calls.length, 1)
            assert.deepEqual(ator.inventory.addCoins.mock.calls[0].arguments[0], { gp: 1, sp: 0, cp: 0 })
        }
        assert.equal(itemA.apagado, true)
        assert.equal(itemB.apagado, true)

        assert.equal(aplicarMudancas.mock.calls.length, 1)
        assert.deepEqual(aplicarMudancas.mock.calls[0].arguments[0], {
            "itemsLoja.-=Actor_a1_Item_A": null,
            "itemsLoja.-=Actor_a2_Item_B": null,
        })
        assert.equal(ui.notifications.warn.mock.calls.length, 0)
    })

    test("só paga quem está marcado para receber", async () => {
        const { ator1, ator2, party } = cenarioPadrao()
        usarParty(party, { a2: false })

        await venderItens()

        // total 200 cp, só 1 jogador recebe: 200 cp = 2 gp
        assert.deepEqual(ator1.inventory.addCoins.mock.calls[0].arguments[0], { gp: 2, sp: 0, cp: 0 })
        assert.equal(ator2.inventory.addCoins.mock.calls.length, 0)
    })

    test("avisa quando o pagamento falha, sem lançar erro", async () => {
        const { ator1, party } = cenarioPadrao()
        ator1.inventory.addCoins = mock.fn(async () => { throw new Error("sem permissão") })
        usarParty(party)

        await assert.doesNotReject(venderItens())

        assert.equal(ui.notifications.error.mock.calls.length, 1)
        const [mensagem, opcoes] = ui.notifications.error.mock.calls[0].arguments
        assert.match(mensagem, /Pague 1 gp para cada jogador/)
        assert.deepEqual(opcoes, { permanent: true })
    })

    test("quando um item não pode ser removido, avisa e paga só o que foi vendido", async () => {
        const { itemB, ator1, ator2, party } = cenarioPadrao()
        itemB.delete = async () => { throw new Error("falhou") }
        usarParty(party)

        await venderItens()

        assert.equal(ui.notifications.warn.mock.calls.length, 1)
        assert.match(ui.notifications.warn.mock.calls[0].arguments[0], /1 item\(ns\) não puderam ser vendidos/)
        // só o itemA foi vendido (100 cp) -> 50 cp para cada um dos 2 jogadores
        for (const ator of [ator1, ator2]) {
            assert.deepEqual(ator.inventory.addCoins.mock.calls[0].arguments[0], { gp: 0, sp: 5, cp: 0 })
        }
    })

    test("ignora um segundo clique enquanto a venda está em andamento", async () => {
        const { ator1, ator2, party } = cenarioPadrao()
        usarParty(party)

        // Dois cliques "ao mesmo tempo": o segundo deve ser descartado.
        await Promise.all([venderItens(), venderItens()])

        assert.equal(ator1.inventory.addCoins.mock.calls.length, 1)
        assert.equal(ator2.inventory.addCoins.mock.calls.length, 1)
    })

    test("libera a trava mesmo quando a venda dá erro (dá para tentar de novo)", async () => {
        const { ator1, party } = cenarioPadrao()
        let chamadas = 0
        mock.method(ShopState, "getParty", () => {
            chamadas++
            if (chamadas === 1) throw new Error("sem party ativa")
            return party
        })
        mock.method(ShopState, "getState", () => ({ playersLoja: {}, itemsLoja: {} }))

        await assert.rejects(venderItens(), /sem party ativa/)
        await venderItens() // a segunda tentativa precisa funcionar

        assert.equal(ator1.inventory.addCoins.mock.calls.length, 1)
    })
})
