import { describe, test, afterEach, mock } from "node:test"
import assert from "node:assert/strict"

import {
    limitarQuantidade, dadosVenda, valorVendaTotal, adicionarResumo, formatarPreco,
    adicionarPO, calcularValorPorJogador, getJogadoresMarcados, distribuirPO,
    itensVendinha, calcularVenda, removerItensVendidos, limparFlagsVendidas,
} from "../scripts/padaria.js"
import { ShopState } from "../scripts/shop-state.js"
import { criarItem, criarAtor, criarParty, marcarItens } from "./helpers.js"

afterEach(() => mock.restoreAll())

describe("limitarQuantidade", () => {
    test("sem quantidade salva, vende 1", () => {
        assert.equal(limitarQuantidade(criarItem({ quantity: 5 }), undefined), 1)
        assert.equal(limitarQuantidade(criarItem({ quantity: 5 }), null), 1)
    })

    test("respeita a quantidade salva quando ela cabe no estoque", () => {
        assert.equal(limitarQuantidade(criarItem({ quantity: 5 }), 3), 3)
    })

    test("nunca passa do que o item tem", () => {
        assert.equal(limitarQuantidade(criarItem({ quantity: 5 }), 10), 5)
    })

    test("item com estoque zero resulta em zero", () => {
        assert.equal(limitarQuantidade(criarItem({ quantity: 0 }), 1), 0)
    })
})

describe("dadosVenda", () => {
    const item = criarItem({ uuid: "Actor.a1.Item.i1", quantity: 5 })

    test("item sem registro na loja vem desmarcado, com quantidade 1", () => {
        assert.deepEqual(dadosVenda(item, { itemsLoja: {} }), { checked: false, quantity: 1 })
    })

    test("item registrado usa a marca e a quantidade salvas (uuid com pontos vira sublinhado)", () => {
        const lojinha = { itemsLoja: { Actor_a1_Item_i1: { checked: true, quantity: 3 } } }
        assert.deepEqual(dadosVenda(item, lojinha), { checked: true, quantity: 3 })
    })

    test("quantidade salva maior que o estoque é cortada no estoque", () => {
        const lojinha = { itemsLoja: { Actor_a1_Item_i1: { checked: true, quantity: 9 } } }
        assert.equal(dadosVenda(item, lojinha).quantity, 5)
    })
})

describe("valorVendaTotal", () => {
    test("item comum vale metade do preço", () => {
        assert.equal(valorVendaTotal(criarItem({ copper: 100 }), 1), 50)
    })

    test("tesouro vale o preço cheio", () => {
        assert.equal(valorVendaTotal(criarItem({ type: "treasure", copper: 100 }), 1), 100)
    })

    test("multiplica pela quantidade vendida", () => {
        assert.equal(valorVendaTotal(criarItem({ copper: 100 }), 3), 150)
    })

    test("respeita o 'per' (ex.: 10 flechas por 1 gp)", () => {
        assert.equal(valorVendaTotal(criarItem({ copper: 100, per: 10 }), 10), 50)
    })

    test("per zerado é tratado como 1", () => {
        assert.equal(valorVendaTotal(criarItem({ copper: 100, per: 0 }), 1), 50)
    })

    test("arredonda para baixo (5 cp pela metade dá 2, não 2,5)", () => {
        assert.equal(valorVendaTotal(criarItem({ copper: 5 }), 1), 2)
    })

    test("preço zero vale zero", () => {
        assert.equal(valorVendaTotal(criarItem({ copper: 0 }), 4), 0)
    })
})

describe("formatarPreco", () => {
    const casos = [
        [0, "0 cp"],
        [7, "7 cp"],
        [10, "1 sp"],
        [99, "9 sp 9 cp"],
        [100, "1 gp"],
        [125, "1 gp 2 sp 5 cp"],
        [1000, "10 gp"],
        [1234, "12 gp 3 sp 4 cp"],
    ]

    for (const [cobre, esperado] of casos) {
        test(`${cobre} cp vira "${esperado}"`, () => {
            assert.equal(formatarPreco(cobre), esperado)
        })
    }
})

describe("adicionarResumo", () => {
    test("acrescenta ao resumo uma linha com valor total e texto formatado", () => {
        const resumo = []
        const item = criarItem({ copper: 250 })

        adicionarResumo(resumo, item, 2, "Stash")

        assert.equal(resumo.length, 1)
        assert.deepEqual(resumo[0], {
            item,
            vendedor: "Stash",
            quantity: 2,
            valorTotal: 250,
            valorTexto: "2 gp 5 sp",
        })
    })
})

describe("adicionarPO", () => {
    test("separa o valor em gp, sp e cp ao adicionar as moedas", async () => {
        const ator = criarAtor()

        await adicionarPO(ator, 125)

        const chamadas = ator.inventory.addCoins.mock.calls
        assert.equal(chamadas.length, 1)
        assert.deepEqual(chamadas[0].arguments[0], { gp: 1, sp: 2, cp: 5 })
    })
})

describe("calcularValorPorJogador", () => {
    test("divide o total igualmente", () => {
        assert.equal(calcularValorPorJogador(100, 1), 100)
        assert.equal(calcularValorPorJogador(100, 4), 25)
    })

    test("sem jogadores, devolve 0 (evita dividir por zero)", () => {
        assert.equal(calcularValorPorJogador(1000, 0), 0)
    })

    // Documenta o comportamento ATUAL: o resto da divisão se perde (1000 / 3 = 333 para cada, sobra 1 cp).
    // Se você decidir mudar essa regra no futuro, este teste vai falhar e avisar.
    test("descarta o resto da divisão (decisão atual do módulo)", () => {
        assert.equal(calcularValorPorJogador(1000, 3), 333)
        assert.equal(calcularValorPorJogador(1, 2), 0)
    })
})

describe("getJogadoresMarcados", () => {
    const a = criarAtor({ id: "a" })
    const b = criarAtor({ id: "b" })
    const party = criarParty({ membros: [a, b] })

    test("sem registro nenhum, todos os membros recebem", () => {
        assert.deepEqual(getJogadoresMarcados(party, undefined), [a, b])
        assert.deepEqual(getJogadoresMarcados(party, {}), [a, b])
    })

    test("quem está desmarcado fica de fora", () => {
        assert.deepEqual(getJogadoresMarcados(party, { a: false }), [b])
    })

    test("quem está marcado explicitamente continua dentro", () => {
        assert.deepEqual(getJogadoresMarcados(party, { a: true, b: false }), [a])
    })

    test("todos desmarcados resulta em lista vazia", () => {
        assert.deepEqual(getJogadoresMarcados(party, { a: false, b: false }), [])
    })
})

describe("distribuirPO", () => {
    test("paga o mesmo valor a cada jogador", async () => {
        const a = criarAtor({ id: "a" })
        const b = criarAtor({ id: "b" })

        await distribuirPO([a, b], 50)

        for (const ator of [a, b]) {
            assert.equal(ator.inventory.addCoins.mock.calls.length, 1)
            assert.deepEqual(ator.inventory.addCoins.mock.calls[0].arguments[0], { gp: 0, sp: 5, cp: 0 })
        }
    })

    test("lista vazia não faz nada nem dá erro", async () => {
        await assert.doesNotReject(distribuirPO([], 50))
    })
})

describe("itensVendinha", () => {
    // Cenário: dois personagens e o Stash da Party.
    const i1 = criarItem({ uuid: "Actor.a1.Item.i1", quantity: 3 })
    const i2 = criarItem({ uuid: "Actor.a1.Item.i2", quantity: 1 }) // nunca marcado
    const i3 = criarItem({ uuid: "Actor.a2.Item.i3", quantity: 1 })
    const i4 = criarItem({ uuid: "Party.p1.Item.i4", quantity: 1 })
    const ator1 = criarAtor({ id: "a1", itens: [i1, i2] })
    const ator2 = criarAtor({ id: "a2", itens: [i3] })

    test("lista só os itens marcados, com o dono (ou 'Stash') e a quantidade", () => {
        const party = criarParty({
            membros: [ator1, ator2],
            itensStash: [i4],
            lojinha: { itemsLoja: marcarItens([i1, i3, i4], { [i1.uuid]: 2 }) },
        })

        assert.deepEqual(itensVendinha(party), [
            { item: i1, actor: ator1, quantity: 2 },
            { item: i3, actor: ator2, quantity: 1 },
            { item: i4, actor: "Stash", quantity: 1 },
        ])
    })

    test("sem nada salvo na flag, devolve lista vazia", () => {
        const party = criarParty({ membros: [ator1, ator2], itensStash: [i4], lojinha: undefined })
        assert.deepEqual(itensVendinha(party), [])
    })

    test("quantidade salva acima do estoque é cortada no estoque", () => {
        const party = criarParty({
            membros: [ator1],
            lojinha: { itemsLoja: marcarItens([i1], { [i1.uuid]: 10 }) },
        })
        assert.equal(itensVendinha(party)[0].quantity, 3)
    })

    test("registro com checked:false é ignorado", () => {
        const party = criarParty({
            membros: [ator1],
            lojinha: { itemsLoja: { Actor_a1_Item_i1: { checked: false, quantity: 2 } } },
        })
        assert.deepEqual(itensVendinha(party), [])
    })

    test("item marcado mas sem estoque (quantidade 0) é ignorado", () => {
        const vazio = criarItem({ uuid: "Actor.a1.Item.i9", quantity: 0 })
        const party = criarParty({
            membros: [criarAtor({ id: "a1", itens: [vazio] })],
            lojinha: { itemsLoja: marcarItens([vazio]) },
        })
        assert.deepEqual(itensVendinha(party), [])
    })
})

describe("calcularVenda", () => {
    test("soma o valor de todas as vendas", () => {
        const vendas = [
            { item: criarItem({ copper: 100 }), quantity: 2 },                  // 100
            { item: criarItem({ type: "treasure", copper: 100 }), quantity: 1 }, // 100
        ]
        assert.equal(calcularVenda(vendas), 200)
    })

    test("sem vendas, o total é 0", () => {
        assert.equal(calcularVenda([]), 0)
    })
})

describe("removerItensVendidos", () => {
    test("vendendo todo o estoque, apaga o item", async () => {
        const item = criarItem({ quantity: 2 })

        const removidos = await removerItensVendidos([{ item, quantity: 2 }])

        assert.equal(item.apagado, true)
        assert.equal(removidos.length, 1)
    })

    test("vendendo parte do estoque, só reduz a quantidade", async () => {
        const item = criarItem({ quantity: 3 })

        await removerItensVendidos([{ item, quantity: 1 }])

        assert.equal(item.apagado, false)
        assert.deepEqual(item.atualizacoes, [{ "system.quantity": 2 }])
    })

    test("se um item falha, os outros continuam e o que falhou não entra na lista", async () => {
        mock.method(console, "error", () => {})
        const quebrado = criarItem({ uuid: "Actor.a1.Item.x", quantity: 1 })
        quebrado.delete = async () => { throw new Error("falhou") }
        const bom = criarItem({ uuid: "Actor.a1.Item.y", quantity: 1 })

        const removidos = await removerItensVendidos([
            { item: quebrado, quantity: 1 },
            { item: bom, quantity: 1 },
        ])

        assert.deepEqual(removidos.map(v => v.item), [bom])
        assert.equal(bom.apagado, true)
        assert.equal(console.error.mock.calls.length, 1)
    })
})

describe("limparFlagsVendidas", () => {
    test("pede para apagar a marca de cada item vendido", async () => {
        const aplicar = mock.method(ShopState, "applyChanges", async () => {})

        await limparFlagsVendidas([
            { item: criarItem({ uuid: "Actor.a1.Item.i1" }) },
            { item: criarItem({ uuid: "Actor.a1.Item.i2" }) },
        ])

        assert.equal(aplicar.mock.calls.length, 1)
        assert.deepEqual(aplicar.mock.calls[0].arguments[0], {
            "itemsLoja.-=Actor_a1_Item_i1": null,
            "itemsLoja.-=Actor_a1_Item_i2": null,
        })
    })
})
