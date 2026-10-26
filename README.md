## Perfis de usuário

| Perfil | Plataforma | O que faz |
|---|---|---|
| Dono(a)/gestor(a) | Web | Gerencia cardápio, entregadores e pedidos; consulta notas e relatórios |
| Salão (mesas) | Web | Abre mesas, lança itens e fecha a conta |
| Cozinha | Web | Acompanha a fila de pedidos e atualiza o preparo |
| Cliente | Mobile | Consulta o cardápio, faz pedidos e acompanha o status |
| Entregador | Mobile | Recebe entregas, atualiza o status e vê o endereço |

## Funcionalidades

**Web**
- Cadastro e login do(a) dono(a)
- Gestão de cardápio (itens, preços, categorias, disponibilidade)
- Painel de pedidos em tempo real, organizado por status
- Cadastro de entregadores e atribuição de pedidos
- Mesas e cozinha
- Emissão de nota fiscal simulada e relatórios

**Mobile**
- Cardápio digital e carrinho com observações
- Escolha entre retirada e entrega
- Acompanhamento do status do pedido em tempo real
- Área do entregador (entregas, status e mapa)
- Notificações de mudança de status

## Tecnologias

- HTML, CSS e JavaScript
- [React](https://react.dev/) + [React-Bootstrap](https://react-bootstrap.netlify.app/)
- [Firebase](https://firebase.google.com/): Authentication e Firestore
- Git e GitHub (versionamento) e Trello (gestão das sprints)
- VS Code

## Modelo de dados (Firestore)

| Coleção | Descrição |
|---|---|
| `usuarios` | Dados do usuário e `perfil` (dono, cliente, entregador etc.) |
| `cardapio` | Itens do cardápio (nome, descrição, preço, categoria, disponibilidade) |
| `pedidos` | Pedidos com `tipo` (mesa, retirada ou entrega), itens, total e `status` |
| `mesas` | Mesas do salão e seu estado |
| `entregadores` | Entregadores cadastrados e disponibilidade |

**Status do pedido:** `recebido` → `em_preparo` → `pronto` → `saiu_entrega` → `entregue` (ou `cancelado`).


## Gestão do projeto

O desenvolvimento é organizado em 4 sprints, acompanhadas em um quadro Kanban no Trello:

1. Planejamento e Fundamentos
2. Web (restaurante)
3. Mobile (cliente e entregador)
4. Nota Fiscal, Relatórios e Fechamento

**Quadro Trello:** [https://trello.com/invite/b/6aa45d1135aeb346ec339352/ATTI372f8a7c4d4f31338b7f5f8710816764A618DF54/conecta-sabor]

## Equipe

| Integrante | Papel |
|---|---|
| Suyane Pereira Costa | Gerente de Projeto e Desenvolvedora |
| Sálua Rayane Melo | Desenvolvedora e Teste e Qualidade |
| Wesley Amorim Campelo | Desenvolvedor e Teste e Qualidade |

## Status

Em desenvolvimento (Sprint 2).
