// Fábricas de objetos falsos usados nos testes.
// Elas imitam só o que o código do módulo realmente lê dos objetos do Foundry.
import { mock } from "node:test"

// Um item de inventário. "copper" é o preço em cobre; "per" é a quantidade por preço (ex.: 10 flechas por 1 gp).
export function criarItem({ uuid = "Actor.a1.Item.i1", name = "Item", type = "equipment", quantity = 1, copper = 100, per = 1 } = {}) {
    return {
        uuid,
        name,
        type,
        system: { quantity, price: { value: { copperValue: copper }, per } },
        apagado: false,
        atualizacoes: [],
        async delete() { this.apagado = true },
        async update(dados) { this.atualizacoes.push(dados) },
    }
}

// Um personagem. "addCoins" é um espião: guarda com o que foi chamado.
export function criarAtor({ id = "a1", name = "Ator", itens = [] } = {}) {
    return {
        id,
        name,
        items: itens,
        inventory: { addCoins: mock.fn(async () => {}) },
    }
}

// A Party. "lojinha" é o que ficaria guardado na flag do módulo.
export function criarParty({ membros = [], itensStash = [], lojinha } = {}) {
    return {
        type: "party",
        active: true,
        members: membros,
        items: itensStash,
        getFlag(modulo, chave) {
            return modulo === "rufos-shopkeeper" && chave === "lojinha" ? lojinha : undefined
        },
        update: mock.fn(async () => {}),
    }
}

// Monta o "itemsLoja" como se o jogador tivesse marcado todos os itens (cada um com a quantidade indicada ou a total).
export function marcarItens(itens, quantidades = {}) {
    return Object.fromEntries(
        itens.map(item => [
            item.uuid.replaceAll(".", "_"),
            { checked: true, quantity: quantidades[item.uuid] ?? item.system.quantity },
        ])
    )
}
