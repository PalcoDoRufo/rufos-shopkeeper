import { ShopState } from "./shop-state.js"
import { formatarPreco, adicionarPO, calcularValorPorJogador, distribuirPO, itensVendinha, calcularVenda, venderItens } from "./padaria.js"

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api

export class shopkeeperApplication extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "rufos-shopkeeper",
        position: {
            width: 1202,
            height: 788
        },
        window: {
            title: "Rufo's Shopkeeper"
        }
    }
    static PARTS = {
        body: {
            template: "modules/rufos-shopkeeper/templates/shop.hbs"
        }
    }

    async _prepareContext(options) {

        const party = game.actors.find(actor => actor.type === "party" && actor.active)

        const lojinha = ShopState.getState()

        const viewLoja = sessionStorage.getItem("rufos-shopkeeper-viewLoja") ?? "rufo"

        const resumo = []

        let mudouPlayers = false

        const moedas = [
            "Platinum Pieces",
            "Gold Pieces",
            "Silver Pieces",
            "Copper Pieces"
        ]

        const blacklist = item => {
            return (
                item.system.quantity > 0 &&
                item.system.price.value.copperValue != 0 &&
                !moedas.includes(item.name)
            )
        }

        const stash = {
            weapons: party.items.filter(i => i.type === "weapon" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            }),
            shields: party.items.filter(i => i.type === "shield" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            }),
            armor: party.items.filter(i => i.type === "armor" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            }),
            equipment: party.items.filter(i => i.type === "equipment" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            }),
            consumables: party.items.filter(i => i.type === "consumable" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            }),
            ammunition: party.items.filter(i => i.type === "ammo" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            }),
            treasure: party.items.filter(i => i.type === "treasure" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            }),
            container: party.items.filter(i => i.type === "backpack" && blacklist(i)).map(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: "Stash", quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }

                return { item, checked, quantity }
            })
        }

        for (const actor of party.members) {
            actor.items.filter(i => i.type === "weapon" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
            actor.items.filter(i => i.type === "shield" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
            actor.items.filter(i => i.type === "armor" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
            actor.items.filter(i => i.type === "equipment" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
            actor.items.filter(i => i.type === "consumable" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
            actor.items.filter(i => i.type === "ammo" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
            actor.items.filter(i => i.type === "treasure" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
            actor.items.filter(i => i.type === "backpack" && blacklist(i)).forEach(item => {
                const key = item.uuid.replaceAll(".", "_")
                const checked = lojinha.itemsLoja[key]?.checked ?? false
                const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                const preco = item.system.price.value.copperValue

                const valorVenda =
                    item.type === "treasure"
                        ? preco
                        : Math.floor(preco / 2)

                const valorTotal = valorVenda * quantity

                if (checked) {
                    resumo.push({
                        item, vendedor: actor.name, quantity, valorVenda, valorTexto: formatarPreco(valorTotal)
                    })
                }
            })
        }

        const personagens = party.members.filter(actor => game.user.isGM || actor.isOwner).map(actor => {

            if (lojinha.playersLoja[actor.id] === undefined) {
                lojinha.playersLoja[actor.id] = true
                mudouPlayers = true
            }

            return {

                id: actor.id,
                name: actor.name,
                img: actor.img,
                checked: lojinha.playersLoja[actor.id] ?? true,

                weapons: actor.items.filter(i => i.type === "weapon" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                }),
                shields: actor.items.filter(i => i.type === "shield" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                }),
                armor: actor.items.filter(i => i.type === "armor" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                }),
                equipment: actor.items.filter(i => i.type === "equipment" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                }),
                consumables: actor.items.filter(i => i.type === "consumable" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                }),
                ammunition: actor.items.filter(i => i.type === "ammo" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                }),
                treasure: actor.items.filter(i => i.type === "treasure" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                }),
                container: actor.items.filter(i => i.type === "backpack" && blacklist(i)).map(item => {
                    const key = item.uuid.replaceAll(".", "_")
                    const checked = lojinha.itemsLoja[key]?.checked ?? false
                    const quantity = lojinha.itemsLoja[key]?.quantity ?? 1

                    return { item, checked, quantity }
                })
            }
        })

        const valorTotal = resumo.reduce((total, item) => {
            return total + (item.valorVenda * item.quantity)
        }, 0)
        const valorTotalTexto = formatarPreco(valorTotal)

        const jogadoresMarcados = Object.values(lojinha.playersLoja)
            .filter(Boolean)
            .length

        const valorPorJogador = calcularValorPorJogador(valorTotal, jogadoresMarcados)

        const valorPorJogadorTexto = formatarPreco(valorPorJogador)

        return { personagens, stash, lojinha, viewLoja, resumo, valorTotalTexto, valorPorJogadorTexto }

    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element.querySelectorAll(".tabsPj").forEach(tab => {
            tab.addEventListener("click", () => {

                this.element.querySelectorAll(".centro section").forEach(tabs => {
                    tabs.classList.remove("exibindo")
                })
                this.element.querySelectorAll(".tabsPj").forEach(tabs => {
                    tabs.classList.remove("exibindo2")
                })

                this.element.querySelector(`.centro section[data-inventario="${tab.dataset.tab}"]`).classList.add("exibindo")
                this.element.querySelector(`.tabsPj[data-tab="${tab.dataset.tab}"]`).classList.add("exibindo2")

                if (tab.dataset.tab === "stash") {
                    this.element.querySelector(".portrait").src = "modules/rufos-shopkeeper/assets/Stash.webp"
                } else {
                    this.element.querySelector(".portrait").src = context.personagens.find(p => p.id === tab.dataset.tab).img
                }

                sessionStorage.setItem("rufos-shopkeeper-viewLoja", tab.dataset.tab);
            })
        })

        this._onClick ??= async event => {

            const plus = event.target.closest(".maisUm")
            const minus = event.target.closest(".menosUm")

            if (!plus && !minus) return


            const linha = event.target.closest(".quantias")
            const value = linha.querySelector(".itemQuantity")
            let quantia = Number(value.textContent)
            const max = Number(value.dataset.max)

            if (plus && quantia < max) quantia++
            if (minus && quantia > 1) quantia--

            value.textContent = quantia

            await ShopState.setItemQuantity(value.dataset.uuid, quantia)
        }

        this.element.removeEventListener("click", this._onClick)
        this.element.addEventListener("click", this._onClick)

        this._onPlayerChange ??= async event => {

            const checkbox = event.target.closest(".pjCheckbox")
            if (!checkbox) return

            await ShopState.setPlayerChecked(
                checkbox.dataset.actor,
                checkbox.checked
            )
        }

        this.element.removeEventListener("change", this._onPlayerChange)
        this.element.addEventListener("change", this._onPlayerChange)

        this._onItemChange ??= async event => {

            const checkbox = event.target.closest(".itemCheckbox")
            if (!checkbox) return

            await ShopState.setItemsChecked(
                checkbox.dataset.uuid,
                checkbox.checked
            )
        }

        this.element.removeEventListener("change", this._onItemChange)
        this.element.addEventListener("change", this._onItemChange)

        this._copyContext = context
        this._onCopyClick ??= async event => {

            const botao = event.target.closest(".copiarMensagem")
            if (!botao) return

            const linhas = this._copyContext.resumo.map(item => {
                return `- x${item.quantity} ${item.item.name} [de ${item.vendedor}] por ${item.valorTexto}`
            })

            const mensagem = [
                "## -- Contabilidade do Grupo --",
                "Venda de tesouros acumulados no inventário do grupo.",
                ...linhas,
                `Totalizando **${this._copyContext.valorTotalTexto}**`,
                `**${this._copyContext.valorPorJogadorTexto}** por personagem`
            ].join("\n")

            await navigator.clipboard.writeText(mensagem)

            ui.notifications.info("Mensagem copiada para a área de transferência.")

        }

        this.element.removeEventListener("click", this._onCopyClick)
        this.element.addEventListener("click", this._onCopyClick)

        this._onSellClick ??= async event => {

            const botao = event.target.closest(".fazerVenda")
            if (!botao) return

            if (this._vendaEmAndamento) return
            this._vendaEmAndamento = true

            const party = game.actors.find(actor => actor.type === "party" && actor.active)

            const itens = itensVendinha(party)

            if (itens.length === 0) {
                ui.notifications.warn("Nenhum item marcado para venda.")
                this._vendaEmAndamento = false
                return
            }

            const valorTotal = calcularVenda(itens)

            const jogadoresMarcados = Object.values(party.getFlag("rufos-shopkeeper", "lojinha")?.playersLoja ?? {}).filter(Boolean).length

            const valorPorJogador = calcularValorPorJogador(valorTotal, jogadoresMarcados)

            const quantidadeTotal = itens.reduce((total, venda) => total + venda.quantity, 0)

            const mensagem = `
            <div class="shopkeeper-confirmacao">

            <h3>Confirmar venda</h3>

            <p>
                Os seguintes valores serão processados:
            </p>

            <div class="shopkeeper-resumo-venda">

                <div>
                    <strong>Itens vendidos</strong>
                    <span>${quantidadeTotal}</span>
                </div>

                <div>
                    <strong>Valor total</strong>
                    <span>${formatarPreco(valorTotal)}</span>
                </div>

                <div>
                    <strong>Jogadores</strong>
                    <span>${jogadoresMarcados}</span>
                </div>

                <div>
                    <strong>Valor por jogador</strong>
                    <span>${formatarPreco(valorPorJogador)}</span>
                </div>

            </div>

            <p class="shopkeeper-aviso-venda">
                <i class="fas fa-triangle-exclamation"></i>
                Os itens vendidos serão removidos dos inventários.
            </p>

        </div>
        `

            try {

                await DialogV2.confirm({
                window: {
                    title: "Confirmar venda"
                },
                content: mensagem,
                yes: {
                    label: "Vender",
                    callback: () => venderItens(party)
                },
                no: {
                    label: "Cancelar"
                }
            })

            } finally {
                this._vendaEmAndamento = false
            }

        }

        this.element.removeEventListener("click", this._onSellClick)
        this.element.addEventListener("click", this._onSellClick)

        const tabInicial = this.element.querySelector(`.tabsPj[data-tab="${context.viewLoja}"]`)
        if (tabInicial && !tabInicial.classList.contains("exibindo2")) {
            tabInicial.click()
        }
    }
}