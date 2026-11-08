# Rufo's Shopkeeper

*por Rufo da Areia Sombria*

![CI](https://github.com/PalcoDoRufo/rufos-shopkeeper/actions/workflows/ci.yml/badge.svg)
![Versão](https://img.shields.io/github/v/release/PalcoDoRufo/rufos-shopkeeper)

Uma lojinha centralizada para Foundry VTT (sistema Pathfinder 2e) que faz a venda de itens do grupo em poucos cliques: o módulo remove os itens dos inventários e distribui o ouro automaticamente.

## Saudações!

Sou Rufo da Areia Sombria, mas, por favor, apenas Rufo. Este é o meu primeiro módulo para Foundry VTT, feito para o sistema Pathfinder 2e!

Em muitas das sessões de RPG que o meu grupo viveu (e, com certeza, em muitas outras mesas por aí), a hora de vender itens e loot sempre toma um bom pedaço do tempo de jogo. Fazer as contas e remover os itens na mão ainda deixa brecha para erros e confusão.

O Rufo's Shopkeeper resolve isso com uma interface de lojinha centralizada: os jogadores marcam os itens que querem vender, o módulo os remove dos respectivos inventários e distribui o dinheiro para o grupo automaticamente.

![Demonstração da loja em funcionamento](https://github.com/PalcoDoRufo/assets-do-rufo/blob/main/rufos-shopkeeper/readme1.gif?raw=true)

## Como funciona

O módulo adiciona um botão (ícone de caveira) ao grupo **Journal Notes** dos controles de cena, na lateral esquerda da tela. Clique nele para abrir a loja.

<p align="center">
  <img src="https://github.com/PalcoDoRufo/assets-do-rufo/blob/main/rufos-shopkeeper/readme2.webp?raw=true" alt="Ícone" width="600">
</p>

Em resumo, uma venda funciona assim:

1. Escolha a aba do inventário que quer vender (um personagem ou o Stash).
2. Marque quem vai receber o ouro.
3. Marque os itens que serão vendidos.
4. Confira o resumo e clique em **Vender**.

### A interface

![Interface da loja](https://github.com/PalcoDoRufo/assets-do-rufo/blob/main/rufos-shopkeeper/readme3.webp?raw=true)

**1. Abas (faixa superior).** Uma aba para cada personagem do grupo e uma para o **Stash**. Os personagens e o inventário do Stash vêm da **Party ativa**. Clicar em uma aba abre, no centro da loja, uma cópia do inventário correspondente. O mestre (GM) vê todas as abas; já os jogadores veem apenas o Stash e os personagens dos quais são **Owner**. Afinal, você só pode vender itens do seu próprio personagem.

**2. Jogadores (faixa esquerda).** Mostra a imagem do personagem da aba aberta e os nomes dos membros da Party, cada um com uma caixa de seleção. O ouro final da venda é dividido entre os personagens marcados. Qualquer jogador pode marcar ou desmarcar um nome, pois qualquer um pode conduzir uma venda. Também é possível fazer uma venda pessoal: marque apenas um jogador e ele recebe todo o ouro.

**3. Inventário (centro).** A cópia do inventário da aba aberta, dividida por categorias. Cada item mostra uma caixa de seleção, a quantidade (com botões **−** e **+** para ajustá-la) e o valor de compra. Marcar a caixa coloca o item no resumo da venda e indica que ele será vendido.

**4. Resumo da venda (faixa direita).** Lista todos os itens marcados, com o inventário de origem (Stash ou personagem), a quantidade vendida e o valor de venda de cada um. Logo abaixo aparecem o valor total da venda e quanto cada jogador marcado vai receber. O valor de venda dos itens é sempre metade do valor de compra, com exceção de itens Treasure, que vendem por preço inteiro.

Todas as checkbox e itens que aparecem no resumo de vendas são atualizados em tempo real para todos os jogadores que estiverem com a loja aberta.

**5. Botões (faixa inferior).**

- **Vender:** inicia a venda e a distribuição do ouro. Antes, uma janela de confirmação mostra a quantidade de itens vendidos, o valor da venda, o valor por jogador e o número de jogadores que vão receber o ouro.
- **Copiar:** se o seu grupo tem um canal de mercado no Discord (ou plataforma parecida) para registrar as vendas, este botão copia para a área de transferência um texto com todo o conteúdo da venda, pronto para colar.

## Instalação

1. No Foundry, vá em **Add-on Modules → Install Module**.
2. Cole o endereço abaixo no campo **Manifest URL** e clique em **Install**:

```
https://github.com/PalcoDoRufo/rufos-shopkeeper/releases/latest/download/module.json
```

3. Em um mundo de Pathfinder 2e, ative o módulo em **Manage Modules**.

### Requisitos

- Foundry VTT v14
- Sistema: [Pathfinder 2e](https://github.com/foundryvtt/pf2e)
- Módulo: [socketlib](https://github.com/farling42/foundryvtt-socketlib) (o Foundry costuma oferecer a instalação junto)


Feito por Rufo da Areia Sombria. Depende do módulo [socketlib](https://github.com/farling42/foundryvtt-socketlib), de farling42.
