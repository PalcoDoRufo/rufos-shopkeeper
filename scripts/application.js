import { ShopState } from "./shop-state.js"
import { categoriasInventario, getJogadoresMarcados, valorVendaTotal, dadosVenda, adicionarResumo, formatarPreco, adicionarPO, calcularValorPorJogador, distribuirPO, itensVendinha, calcularVenda, venderItens } from "./padaria.js"
import { getSocket } from "./socket.js"

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api

function escaparHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
}

function montarConfirmacao(itens, jogadores, valorTotal, valorPorJogador) {

    const quantidadeTotal = itens.reduce((total, venda) => total + venda.quantity, 0)

    const linhas = itens.map(({ item, actor, quantity }) => {

        const vendedor = typeof actor === "string" ? actor : actor.name

        return `
            <li class="shopkeeper-linha">
                <img src="${escaparHTML(item.img)}" alt="">
                <span class="shopkeeper-nome">
                    ${escaparHTML(item.name)}
                    <small>${escaparHTML(vendedor)}</small>
                </span>
                <span class="shopkeeper-qtd">x${quantity}</span>
                <span class="shopkeeper-valor">${formatarPreco(valorVendaTotal(item, quantity))}</span>
            </li>`
    }).join("")

    const chips = jogadores
        .map(actor => `<span class="shopkeeper-chip">${escaparHTML(actor.name)}</span>`)
        .join("")

    return `
        <div class="shopkeeper-confirmacao">

            <p class="shopkeeper-intro">Revise a venda antes de confirmar.</p>

            <ul class="shopkeeper-itens">${linhas}</ul>

            <div class="shopkeeper-totais">
                <div>
                    <span>Itens</span>
                    <strong>${quantidadeTotal}</strong>
                </div>
                <div>
                    <span>Valor total</span>
                    <strong>${formatarPreco(valorTotal)}</strong>
                </div>
                <div class="shopkeeper-destaque">
                    <span>Por jogador</span>
                    <strong>${formatarPreco(valorPorJogador)}</strong>
                </div>
            </div>

            <div class="shopkeeper-jogadores">
                <span>Recebem (${jogadores.length}):</span>
                ${chips}
            </div>

            <p class="shopkeeper-aviso">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Os itens vendidos serão removidos dos inventários.
            </p>

        </div>`
}

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

        const stashAtivo = viewLoja === "stash"

        const resumo = []

        const stash = {}

        let mudouPlayers = false

        const ehMoeda = item => item.isCoinage ?? item.system.stackGroup === "coins"

        const blacklist = item => {
            return (
                item.system.quantity > 0 &&
                item.system.price.value.copperValue != 0 &&
                !ehMoeda(item)
            )
        }

        for (const [nome, tipo] of categoriasInventario) {

            const linhas = party.items
                .filter(i => i.type === tipo && blacklist(i))
                .map(item => {

                    const { checked, quantity } = dadosVenda(item, lojinha)

                    if (checked) {
                        adicionarResumo(resumo, item, quantity, "Stash")
                    }

                    return {item, checked, quantity}
                })

            stash[nome] = stashAtivo ? linhas : []
        }

        for (const actor of party.members) {

            for (const [, tipo] of categoriasInventario) {

                actor.items
                    .filter(i => i.type === tipo && blacklist(i))
                    .forEach(item => {

                        const { checked, quantity } = dadosVenda(item, lojinha)

                        if (checked) {
                            adicionarResumo(resumo, item, quantity, actor.name)
                        }
                    })
            }
        }

        const personagensAside = party.members.map(actor => {

            if (lojinha.playersLoja[actor.id] === undefined) {
                lojinha.playersLoja[actor.id] = true
                mudouPlayers = true
            }
            return {
                id: actor.id,
                name: actor.name,
                img: actor.img,
                checked: lojinha.playersLoja[actor.id] ?? true
            }
        })

        const personagens = party.members
            .filter(actor => game.user.isGM || actor.isOwner)
            .map(actor => {

                if (lojinha.playersLoja[actor.id] === undefined) {
                    lojinha.playersLoja[actor.id] = true
                    mudouPlayers = true
                }

                const ativo = actor.id === viewLoja

                const inventario = {}

                for (const [nome, tipo] of categoriasInventario) {

                    // Aba fechada: não monta a lista (e o template não desenha nada).
                    inventario[nome] = !ativo ? [] : actor.items
                        .filter(i => i.type === tipo && blacklist(i))
                        .map(item => {

                            const { checked, quantity } = dadosVenda(item, lojinha)

                            return {item, checked, quantity}
                        })
                }

                return {

                    id: actor.id,
                    name: actor.name,
                    img: actor.img,
                    checked: lojinha.playersLoja[actor.id] ?? true,
                    ativo,

                    ...inventario

                }
            })

        const valorTotal = resumo.reduce((total, item) => {
            return total + item.valorTotal
        }, 0)
        const valorTotalTexto = formatarPreco(valorTotal)

        const jogadoresMarcados = getJogadoresMarcados(party, lojinha.playersLoja).length

        const valorPorJogador = calcularValorPorJogador(valorTotal, jogadoresMarcados)

        const valorPorJogadorTexto = formatarPreco(valorPorJogador)

        return { personagens, personagensAside, stash, stashAtivo, lojinha, viewLoja, resumo, valorTotalTexto, valorPorJogadorTexto }

    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        const mostrarAba = tabId => {

            const aba = this.element.querySelector(`.tabsPj[data-tab="${tabId}"]`)
            if (!aba) return

            this.element.querySelectorAll(".centro section").forEach(secao => {
                secao.classList.remove("exibindo")
            })
            this.element.querySelectorAll(".tabsPj").forEach(botao => {
                botao.classList.remove("exibindo2")
            })

            this.element.querySelector(`.centro section[data-inventario="${tabId}"]`)?.classList.add("exibindo")
            aba.classList.add("exibindo2")

            if (tabId === "stash") {
                this.element.querySelector(".retrato").src = "modules/rufos-shopkeeper/assets/Stash.webp"
            } else {
                const personagem = context.personagens.find(p => p.id === tabId)
                if (personagem) this.element.querySelector(".retrato").src = personagem.img
            }
        }

        this.element.querySelectorAll(".tabsPj").forEach(tab => {
            tab.addEventListener("click", () => {

                if (tab.dataset.tab === context.viewLoja) return

                sessionStorage.setItem("rufos-shopkeeper-viewLoja", tab.dataset.tab)
                this.render()
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

            const uuid = value.dataset.uuid

            this._pendentes ??= new Map()
            clearTimeout(this._pendentes.get(uuid)?.timer)

            const timer = setTimeout(() => {
                this._pendentes.delete(uuid)
                ShopState.setItemQuantity(uuid, quantia).catch(console.error)
            }, 400)

            this._pendentes.set(uuid, { timer, quantia })
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

            await this._flushQuantidades()

            const party = game.actors.find(actor => actor.type === "party" && actor.active)

            const itens = itensVendinha(party)

            if (itens.length === 0) {
                ui.notifications.warn("Nenhum item marcado para venda.")
                this._vendaEmAndamento = false
                return
            }

            const jogadores = getJogadoresMarcados(party, party.getFlag("rufos-shopkeeper", "lojinha")?.playersLoja)

            if (jogadores.length === 0) {
                ui.notifications.warn("Nenhum jogador marcado para receber.")
                this._vendaEmAndamento = false
                return
            }

            const valorTotal = calcularVenda(itens)

            const valorPorJogador = calcularValorPorJogador(valorTotal, jogadores.length)

            const mensagem = montarConfirmacao(itens, jogadores, valorTotal, valorPorJogador)

            try {

                await DialogV2.confirm({
                    classes: ["rufos-confirmacao"],
                    position: { width: 520 },
                    window: {
                        title: "Confirmar venda",
                        icon: "fa-solid fa-coins"
                    },
                    content: mensagem,
                    yes: {
                        label: "Vender",
                        icon: "fa-solid fa-coins",
                        callback: async () => {

                            if (game.user.isGM) {
                                await venderItens()
                            } else {
                                const socket = getSocket()
                                await socket.executeAsGM("sellItems")
                            }

                        }
                    },
                    no: {
                        label: "Cancelar",
                        icon: "fa-solid fa-xmark"
                    }
                })

            } finally {
                this._vendaEmAndamento = false
            }
        }

        this.element.removeEventListener("click", this._onSellClick)
        this.element.addEventListener("click", this._onSellClick)

        mostrarAba(context.viewLoja)

        for (const [uuid, { quantia }] of this._pendentes ?? []) {
            const campo = this.element.querySelector(`.itemQuantity[data-uuid="${uuid}"]`)
            if (campo) campo.textContent = quantia
        }
    }

    async _flushQuantidades() {

        if (!this._pendentes?.size) return

        const lista = [...this._pendentes.entries()]
        this._pendentes.clear()

        for (const [uuid, { timer, quantia }] of lista) {
            clearTimeout(timer)
            await ShopState.setItemQuantity(uuid, quantia)
        }
    }

    async close(options) {

        await this._flushQuantidades()

        return super.close(options)
    }
}