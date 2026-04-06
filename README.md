# EventPass Web3 Frontend

Frontend da DApp EventPass construída com React, Vite e Ethers.js.

Este projeto conecta uma interface web aos contratos inteligentes do ecossistema EventPass, permitindo interações on-chain como staking, mint de NFT e votação em DAO diretamente pela MetaMask.

Atualmente, a maior parte da lógica Web3 está centralizada em `src/App.jsx`, com uso de ABIs e endereços configurados em `src/abi/` e `src/config/contracts.js`.

## Visão Geral

O app oferece um painel único para:

- conectar carteira via MetaMask
- visualizar saldo do token EVT
- fazer approve e stake de tokens
- mintar NFT de ingresso
- consultar NFT por ID (owner e tokenURI)
- criar propostas e votar na DAO
- consultar preço ETH/USD via Chainlink Oracle

## Stack

- React 19
- Vite 8
- Ethers.js 6
- ESLint 9

## Funcionalidades

### 1. Conexão de Carteira

- solicitação de acesso à conta com `eth_requestAccounts`
- leitura do endereço conectado
- atualização dos dados após conexão e confirmação de transações

### 2. Token EVT

- consulta de saldo com `balanceOf(address)`
- uso do token para staking e governança

### 3. Staking

Fluxo implementado na interface:

1. `approve` no contrato ERC20 para o contrato de staking
2. `stake(amount)` no contrato de staking
3. leitura de `stakes(address)` para valor e timestamp

### 4. NFT de Evento

- mint do ingresso digital com `mintPass(address, tokenUri)`
- input de Token URI para metadados do NFT

### 5. Governança DAO

- criação de proposta com descrição e duração
- votação em proposta por ID (`SIM` ou `NÃO`)

### 6. Oracle Chainlink

- leitura do preço ETH/USD com `getLatestPrice()`
- formatação do valor para exibição no frontend

## Estrutura de Pastas

```text
eventpass-frontend/
	src/
		abi/
			daoAbi.js
			nftAbi.js
			oracleAbi.js
			stakingAbi.js
			tokenAbi.js
		config/
			contracts.js
		services/
			web3Service.js
		components/
			StakingSection.jsx
			WalletSection.jsx
		App.jsx
```

Observação: neste estado do projeto, `StakingSection.jsx` e `WalletSection.jsx` estão reservados para modularização futura e ainda não possuem implementação ativa.

## Pré-requisitos

- Node.js 20+
- npm 9+
- MetaMask instalada no navegador
- endereços de contratos já deployados

## Configuração

### 1. Instalar dependências

Entre na pasta do frontend e instale as dependências:

```bash
cd eventpass-frontend
npm install
```

### 2. Criar arquivo `.env`

Crie um arquivo `.env` em `eventpass-frontend/` com as variáveis:

```env
VITE_TOKEN_ADDRESS=0x...
VITE_NFT_ADDRESS=0x...
VITE_STAKING_ADDRESS=0x...
VITE_DAO_ADDRESS=0x...
VITE_ORACLE_ADDRESS=0x...
```

Esses valores são consumidos em `src/config/contracts.js`.

### 3. Rodar o projeto

```bash
npm run dev
```

O Vite exibirá a URL local (geralmente `http://localhost:5173`).

## Scripts Disponíveis

- `npm run dev`: inicia ambiente local em modo desenvolvimento
- `npm run build`: gera build de produção
- `npm run preview`: sobe servidor para testar build local
- `npm run lint`: executa lint no código

## Fluxo de Uso na Interface

1. Clique em `Conectar MetaMask`.
2. Verifique carteira, saldo EVT, stake atual e preço ETH.
3. Informe um valor e execute `Approve`.
4. Execute `Stake` com o mesmo valor aprovado.
5. Informe um Token URI e clique em `Mint NFT`.
6. Crie uma proposta DAO e vote por ID.

## Observações Importantes

- O app depende de contratos compatíveis com os ABIs em `src/abi/`.
- Se a carteira estiver em rede incorreta, as transações podem falhar.
- Erros de contrato/rede aparecem no status da UI e no console do navegador.
- Ainda não há listeners em tempo real para `accountsChanged` e `chainChanged`; a atualização ocorre pelos fluxos de ação da interface.

## Próximos Passos Sugeridos

- adicionar detecção de troca de rede e conta em tempo real
- adicionar histórico de transações
- melhorar tratamento de erros por código de revert
- incluir testes de integração com carteira mockada
