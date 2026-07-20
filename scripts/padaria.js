import { ShopState } from "./shop-state.js"

export function dadosVenda(item, lojinha) {

    const key = item.uuid.replaceAll(".", "_")

    return {
        checked: lojinha.itemsLoja[key]?.checked ?? false,
        quantity: lojinha.itemsLoja[key]?.checked ?? 1
    }

}

export function adicionarResumo(resumo, item, quantity, vendedor) {

    const preco = item.system.price.value.copperValue

    const valorVenda =
        item.type === "treasure"
            ? preco
            : Math.floor(preco / 2)

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

    if (quantidadeJogadores === 0) {return 0}

    return Math.floor(valorTotal / quantidadeJogadores)

}

export async function distribuirPO(playersLoja, valorPorJogador) {

    for (const actorId of Object.keys(playersLoja)) {

        if (!playersLoja[actorId]) continue

        const actor = game.actors.get(actorId)

        if (!actor) continue

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

            itensVendinha.push({item, actor, quantity: dados.quantity ?? 1})
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

        const preco = venda.item.system.price.value.copperValue

        const valorVenda = venda.item.type === "treasure" ? preco : Math.floor(preco/2)

        return total + (valorVenda * venda.quantity)

    },0)

}

export async function venderItens(party) {

    const itens = itensVendinha(party)
    const lojinha = ShopState.getState()
    const valorTotal = calcularVenda(itens)

    const jogadoresMarcados = Object.values(lojinha.playersLoja ?? {}).filter(Boolean).length

    const valorPorJogador = calcularValorPorJogador(valorTotal, jogadoresMarcados)

    console.log("Itens vendidos:", itens)
    console.log("Valor total:", valorTotal)
    console.log("Valor por jogador:", valorPorJogador)

    await distribuirPO(lojinha.playersLoja, valorPorJogador)

    await removerItensVendidos(itens)

    await limparFlagsVendidas(party, itens)

    console.log("Venda concluída.")

}

export async function removerItensVendidos(itens) {

    for (const venda of itens) {

        const {item, quantity} = venda

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

export async function limparFlagsVendidas(party, itens) {

    const lojinha = foundry.utils.deepClone(
        party.getFlag("rufos-shopkeeper", "lojinha") ?? {}
    )

    for (const venda of itens) {
        const key = venda.item.uuid.replaceAll(".", "_")
        delete lojinha.itemsLoja[key]
    }

    await ShopState.saveState(lojinha)

}