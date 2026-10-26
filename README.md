# Conecta Sabor

Plataforma web (responsiva, também usada no celular) para gestão de **pedidos, mesas, cozinha, cardápio e entregas** de restaurantes de pequeno porte.

Projeto acadêmico da disciplina **Desenvolvimento Web** — Universidade de Fortaleza (UNIFOR), Centro de Ciências Tecnológicas.

---

## Sobre o projeto

Pequenos restaurantes costumam controlar pedidos, mesas e entregas por WhatsApp, papel e memória. Isso gera erros de pedido, atrasos, falta de visibilidade do status e nenhum controle de vendas.

O **Conecta Sabor** reúne tudo em um único fluxo: o cliente acessa o cardápio do restaurante, o pedido chega à cozinha em tempo real, o salão acompanha as mesas e a entrega é atribuída a um entregador.

**Diferencial:** o sistema é um **canal próprio do restaurante**. Não cobra comissão por pedido e não coloca o cliente numa vitrine com concorrentes. Cada restaurante tem seu **link e QR Code**, e quem abre já cai direto no cardápio dele.

## Perfis de usuário e permissões

| Perfil | Como se cadastra | O que acessa |
|---|---|---|
| **Dono(a)** | Cadastro do restaurante (nome, CNPJ, responsável, e-mail e senha) | Tudo: cardápio, pedidos, mesas, cozinha e links da equipe |
| **Funcionário do salão** | Link enviado pelo dono | Mesas, painel de pedidos e disponibilidade do cardápio |
| **Cozinha** | Link enviado pelo dono | Tela da cozinha e cardápio (adiciona, edita e marca disponibilidade) |
| **Entregador** | Link enviado pelo dono | Área do entregador (em desenvolvimento no mobile) |
| **Cliente** | Link ou QR Code do restaurante (nome, e-mail e senha, ou Google) | Cardápio do restaurante e pedidos |

Funcionários, cozinha e entregadores informam apenas **nome, e-mail e senha** (ou Google). Só o dono exclui itens do cardápio.

## Funcionalidades

**Cadastro e login**
- Escolha do tipo de usuário **antes** de qualquer cadastro.
- Cadastro do restaurante com **validação de CNPJ** e bloqueio de CNPJ duplicado.
- Login com e-mail e senha ou **Google**, opção **Manter conectado** e **Esqueci minha senha**.
- Telas protegidas por perfil: cada usuário é levado para a sua área.

**Link e QR Code do restaurante**
- Página pública do restaurante (`/r/ID`) com o cardápio, sem precisar de login para ver.
- O sistema lembra o último restaurante aberto no aparelho.
- O dono copia o link, baixa o QR Code e gera os **links de cadastro da equipe** (salão, cozinha e entregadores).

**Cardápio**
- Cadastro, edição e exclusão de itens com **foto**, descrição, preço e categoria.
- **Promoção** (preço antigo riscado e selo de desconto), **combo do dia** e **combo da semana**.
- Interruptor de **disponibilidade** para imprevistos.
- O cliente vê **apenas os itens disponíveis**, com atualização em tempo real.
- Vitrine com abas de categoria, aba "Ofertas e combos", duas colunas no computador e uma no celular.

**Pedidos, cozinha e mesas**
- **Painel de pedidos** em colunas por status, em tempo real, com tempo de espera e alerta de **atraso** (meta de 25 minutos).
- **Novo pedido** de balcão ou telefone (retirada ou entrega), com observação em cada prato.
- **Mesas:** adicionar mesas, lançar pedidos por mesa, ver o total da conta e **fechar a conta**.
- **Cozinha:** tela com os pedidos para iniciar o preparo e marcar como pronto, com aviso sonoro opcional.
- Atribuição de **entregador** nos pedidos de entrega.

## Status do pedido

```
Recebido  →  Em preparo  →  Pronto  →  Finalizado
                              └──→  Saiu para entrega  →  Finalizado   (somente entrega)
Cancelado (a qualquer momento antes de finalizar)
```

| Quem muda | Etapas |
|---|---|
| Cozinha | Recebido → Em preparo → Pronto |
| Salão | Pronto → Finalizado (servido ou retirado) e Saiu para entrega → Entregue; cancelamento; escolha do entregador |
| Dono | Todas |

"Atrasado" não é um status gravado: a tela marca em vermelho os pedidos que passam de 25 minutos em Recebido ou Em preparo.

## Tecnologias

- HTML, CSS e JavaScript
- [React](https://react.dev/) com [Vite](https://vite.dev/)
- [React-Bootstrap](https://react-bootstrap.netlify.app/) e Bootstrap 5
- [React Router](https://reactrouter.com/)
- [Firebase](https://firebase.google.com/): Authentication e Firestore
- [qrcode.react](https://github.com/zpao/qrcode.react) (QR Code)
- Git, GitHub e Trello

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/login` | Login | Público |
| `/cadastro` | Escolha do tipo de cadastro | Público |
| `/cadastro/restaurante` | Cadastro do restaurante | Público |
| `/cadastro/cliente` | Cadastro do cliente | Público |
| `/convite/:restauranteId/:tipo` | Cadastro de equipe pelo link do dono | Público (link) |
| `/r/:restauranteId` | Página e cardápio do restaurante | Público |
| `/painel` | Painel principal | Dono, salão e cozinha |
| `/painel/cardapio` | Gestão do cardápio | Dono, salão e cozinha |
| `/painel/pedidos` | Painel de pedidos | Dono e salão |
| `/painel/mesas` | Mesas | Dono e salão |
| `/painel/cozinha` | Cozinha | Dono e cozinha |
| `/cliente` | Início do cliente | Cliente |
| `/entregador` | Área do entregador | Entregador |

## Modelo de dados (Firestore)

| Coleção | Principais campos |
|---|---|
| `usuarios` | nome, email, perfil (`dono`, `funcionario`, `cozinha`, `entregador`, `cliente`), restauranteId, status |
| `restaurantes` | nome, cnpj, donoId, donoNome |
| `cardapio` | restauranteId, nome, descricao, preco, precoPromocional, categoria, oferta (`nenhuma`, `promocao`, `combo_dia`, `combo_semana`), disponivel, imagemUrl |
| `mesas` | restauranteId, numero, status (`livre` ou `ocupada`) |
| `pedidos` | restauranteId, tipo (`mesa`, `retirada`, `entrega`), itens (com observação), total, status, mesaId, mesaNumero, contaAberta, clienteNome, clienteTelefone, endereco, entregadorId, entregadorNome, origem, criadoEm |

## Como executar

**Pré-requisitos:** [Node.js](https://nodejs.org/) (versão LTS) e um projeto no Firebase.

```bash
# 1. Clonar o repositório
git clone <URL-DO-REPOSITORIO>
cd <NOME-DA-PASTA>

# 2. Instalar as dependências
npm install

# 3. Criar o arquivo .env (veja abaixo)

# 4. Rodar o projeto
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`) em um navegador comum, como Chrome ou Edge.

### Variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto com os dados do app Web do seu projeto Firebase:

```env
VITE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_MESSAGING_SENDER_ID=
VITE_APP_ID=
```

O `.env` não vai para o GitHub (está no `.gitignore`).

### Configuração do Firebase

1. **Authentication → Sign-in method:** ative **E-mail/senha** e **Google**.
2. **Firestore Database:** crie o banco (região `southamerica-east1`) e, na aba **Regras**, publique:

<details>
<summary>Regras do Firestore</summary>

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /restaurantes/{id} {
      allow get: if true;
    }
    match /cardapio/{id} {
      allow read: if resource.data.disponivel == true;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

</details>

## Estrutura de pastas

```
src/
├── components/   # CardapioCliente, itemCardapio, CartaoPedido, QuadroPedidos, NovoPedido, RotaProtegida
├── contexts/     # AuthContext (autenticação e perfil)
├── hooks/        # usePedidosAtivos (pedidos em tempo real)
├── pages/        # Telas: Login, Cadastro*, Dashboard, GestaoCardapio, PainelPedidos, Mesas, Cozinha...
├── utils/        # cnpj, formatar, imagem, pedidos, alerta, RestauranteAtual
├── firebase.jsx  # Conexão com o Firebase
├── App.jsx       # Rotas
└── index.css     # Estilos globais e paleta de cores
```

## Decisões técnicas

- **100% gratuito:** o projeto usa só o plano gratuito do Firebase (Spark), como pedido na disciplina. Por isso não usamos Firebase Storage nem Cloud Functions, que exigem plano pago.
- **Fotos do cardápio:** reduzidas no navegador (até 640 px, JPEG) e salvas no próprio Firestore.
- **Tempo real:** cozinha, painel, mesas e vitrine do cliente usam `onSnapshot` do Firestore, então tudo se atualiza sem recarregar a página.
- **Mobile:** a mesma aplicação é responsiva e pode ser usada no celular pelo navegador.
- **Paleta:** `#5a372c`, `#8b8b70`, `#98c7b0`, `#f0f0d8` e `#c94b0c`.

## Fluxo de trabalho (Git)

- A branch `main` contém sempre a versão estável.
- Cada funcionalidade é feita em uma branch própria (`feature/nome`) e entra na `main` por **Pull Request**.
- Mensagens de commit seguem o padrão `feat:`, `fix:`, `docs:` e `chore:`.

## Gestão do projeto

O desenvolvimento é organizado em 4 sprints, acompanhadas em um quadro Kanban no Trello:

1. Planejamento e Fundamentos
2. Aplicação Web (restaurante)
3. Mobile (cliente e entregador)
4. Nota Fiscal, Relatórios e Fechamento

**Quadro Trello:** (https://trello.com/invite/b/6aa45d1135aeb346ec339352/ATTI372f8a7c4d4f31338b7f5f8710816764A618DF54/conecta-sabor)

## Equipe

| Integrante | Papel |
|---|---|
| Suyane Pereira Costa | Gerente de Projeto e Desenvolvedora |
| Sálua Rayane Melo | Desenvolvedora e Teste e Qualidade |
| Wesley Amorim Campelo | Desenvolvedor e Teste e Qualidade |

## Status e próximos passos

**Concluído (Sprint 2 — Web):** cadastro e login por perfil, link e QR Code do restaurante, gestão de cardápio, vitrine do cliente, painel de pedidos, mesas e cozinha.

**Próximos passos:**
- Carrinho e pedidos feitos pelo cliente no celular.
- Área do entregador (lista de entregas e atualização de status).
- Nota fiscal simulada e relatórios.
- Regras de segurança do Firestore por perfil.
- Publicação gratuita no Firebase Hosting.
