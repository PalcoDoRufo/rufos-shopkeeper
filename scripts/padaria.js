import { ShopState } from "./shop-state.js"

let vendaEmAndamento = false

export const categoriasInventario = [

    ["weapons", "weapon"],
    ["shields", "shield"],
    ["armor", "armor"],
    ["equipment", "equipment"],
    ["consumables", "consumable"],
    ["ammunition", "ammo"],
    ["treasure", "treasure"],
    ["container", "backpack"]

]

export function limitarQuantidade(item, quantidadeSalva) {

    return Math.min(quantidadeSalva ?? 1, item.system.quantity)

}

export function dadosVenda(item, lojinha) {

    const key = item.uuid.replaceAll(".", "_")

    return {
        checked: lojinha.itemsLoja[key]?.checked ?? false,
        quantity: limitarQuantidade(item, lojinha.itemsLoja[key]?.quantity)
    }
}

export function precoVendaUnitario(item) {

    const preco = item.system.price.value.copperValue

    return item.type === "treasure"
        ? preco
        : Math.floor(preco / 2)

}

export function adicionarResumo(resumo, item, quantity, vendedor) {

    const valorVenda = precoVendaUnitario(item)

    const valorTotal = valorVenda * quantity

    resumo.push({
        item,
        vendedor,
        quantity,
        valorVenda,
        valorTexto: formatarPreco(valorTotal)
    })
}

export function formatarPreco(cobre) {

    const gp = Math.floor(cobre / 100)
    const sp = Math.floor((cobre % 100) / 10)
    const cp = cobre % 10

    const moedas = []

    if (gp > 0) { moedas.push(`${gp} gp`) }
    if (sp > 0) { moedas.push(`${sp} sp`) }
    if (cp > 0) { moedas.push(`${cp} cp`) }

    if (moedas.length === 0) {
        return "0 cp"
    }
    return moedas.join(" ")

}

export async function adicionarPO(actor, cobre) {

    const gp = Math.floor(cobre / 100)
    const sp = Math.floor((cobre % 100) / 10)
    const cp = cobre % 10

    await actor.inventory.addCoins({
        gp, sp, cp
    })
}

export function calcularValorPorJogador(valorTotal, quantidadeJogadores) {

    if (quantidadeJogadores === 0) { return 0 }

    return Math.floor(valorTotal / quantidadeJogadores)

}

export function getJogadoresMarcados(party, playersLoja) {

    return party.members.filter(actor => playersLoja?.[actor.id] ?? true)

}

export async function distribuirPO(jogadores, valorPorJogador) {

    for (const actor of jogadores) {

        await adicionarPO(actor, valorPorJogador)

    }

}

export function itensVendinha(party) {

    const itensVendinha = []

    const lojinha = party.getFlag("rufos-shopkeeper", "lojinha")

    function botarNoBalcao(itens, actor) {

        for (const item of itens) {

            const key = item.uuid.replaceAll(".", "_")

            const dados = lojinha?.itemsLoja?.[key]

            if (!dados?.checked) continue

            const quantity = limitarQuantidade(item, dados.quantity)

            if (quantity <= 0) continue

            itensVendinha.push({ item, actor, quantity })
        }
    }

    for (const actor of party.members) {
        botarNoBalcao(actor.items, actor)
    }

    botarNoBalcao(party.items, "Stash")

    return itensVendinha

}

export function calcularVenda(itensVendinha) {

    return itensVendinha.reduce((total, venda) => {

        return total + (precoVendaUnitario(venda.item) * venda.quantity)

    }, 0)
}

export async function venderItens() {

    if (vendaEmAndamento) return
    vendaEmAndamento = true

    try {
        const party = ShopState.getParty()

        const itens = itensVendinha(party)
        const lojinha = ShopState.getState()
        const valorTotal = calcularVenda(itens)

        const jogadores = getJogadoresMarcados(party, lojinha.playersLoja)
        const jogadoresMarcados = jogadores.length

        const valorPorJogador = calcularValorPorJogador(valorTotal, jogadoresMarcados)

        console.log("Itens vendidos:", itens)
        console.log("Valor total:", valorTotal)
        console.log("Valor por jogador:", valorPorJogador)

        await distribuirPO(jogadores, valorPorJogador)

        await removerItensVendidos(itens)

        await limparFlagsVendidas(itens)

        console.log("Venda concluída.")
    } finally {
        vendaEmAndamento = false
    }
}

export async function removerItensVendidos(itens) {

    for (const venda of itens) {

        const { item, quantity } = venda

        const quantidadeAtual = item.system.quantity
        const quantidadeRestante = quantidadeAtual - quantity

        if (quantidadeRestante <= 0) {
            await item.delete()
            continue
        }

        await item.update({
            "system.quantity": quantidadeRestante
        })
    }
}

export async function limparFlagsVendidas(itens) {

    const changes = {}

    for (const venda of itens) {
        const key = venda.item.uuid.replaceAll(".", "_")
        changes[`itemsLoja.-=${key}`] = null
    }

    await ShopState.applyChanges(changes)

}