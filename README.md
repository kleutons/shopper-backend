# 🚀 Desafio FullStak Shopper.com.br (Repositório BACKEND)

Bem-vindo(a). Este é o desafio BACKEND, para a Shopper.com.br!
O objetivo deste desafio é um teste técnico para avaliar habilidades em desenvolvimento de software.

# 🧠 Contexto
... VerRepoFrontEnd ...

## 📋 REQUISITOS

Chegou a hora de colocar a mão na massa!
- [x] O sistema deve permitir que o usuário carregue o arquivo de precificação
- [x] O sistema deve ter um botão chamado VALIDAR
    - [x] Todos os campos necessários existem?
    - [x] Os códigos de produtos informados existem?
    - [x] Os preços estão preenchidos e são valores numéricos validos? 
    - [x] Os códigos de produtos informados existem?
    - [x] Valida: Preço nao pode está abaixo do custo
    - [x] Valida: Reajuste maior ou menor do que 10%
    - [x] Nova Reqra: Valida Tipo de produto, é unitário, é um kit, ou faz parte de um kit
    - [x] Valida: Se é um Kit - o csv deve conter os reajustes dos preços dos componentes do pacote.
        - [x] Valida: verificar se preço final da soma dos componentes seja igual ao preço do pacote.
- [x] Finalzar Validação: e exibir Codigo, Nome, Preço Atual, Novo Preço
- [x] Exibir ao lado de cada produto qual regra foi quebrada
- [x] Habilitar botão ATUALIZAR, somente se todas as linhas estiver Validada
    - [x] Ao clica em ATUALIZAR, o sistema deve salvar o novo preço no banco de dados, com tela pronta para o envio de um novo arquivo. 
    - [x] Nova Reqra: Valida Tipo de produto, é unitário, é um kit, ou faz parte de um kit
    - [x] O preço de custo dos pacotes também deve ser atualizado como a soma dos custos dos seus componentes. 


## 👨‍💻 Instalação

### BACKEND

1. Clonar este repositório
```bash
git clone https://github.com/kleutons/shopper-backend
```

2. Instalar dependência 
```bash
npm install
```

3. Executar Front-end
```bash
npm run dev
```

4. Acessar Servidor BACKEND na porta: 4000
```
http://localhost:4000/
```

4. ROTAS disponiveis
- http://localhost:4000/list-unique  => Rota GET para listar produtos unicos, que não fazem parte de uma kit
- http://localhost:4000/list-pack    => Rota GET para listar produtos que é um kit de produtos
- http://localhost:4000/validade-csv  => Rota POST para recever upload de arquivo CSV e retornar se está válido
- http://localhost:4000/bulk-update  => Rota POST para recever upload de arquivo CSV e se for válido atuliza em massa no banco de dados

5. Arquivo DATABASE para enviar no servidor mysql, está na pasta /database
[database.sql](./database/database.sql)

6. Arquivo para testes CSV para testar upload no servidor, está na pasta /database
[atualizacao_preco_exemplo.csv](./database/atualizacao_preco_exemplo.csv)


### Servidor BackEnd
Siga os passos descrito no Readme do repositório referente ao servidor backend: 
- https://github.com/kleutons/shopper-frontend

## 👨‍💻 Sobre Mim
### Made with 💙 by [@kleutons](https://github.com/kleutons)

### Contato
- [LinkedIn](https://www.linkedin.com/in/kleuton-novais/)
- [Portfólio](https://kleuton.dev)

###
Estou ansioso para receber feedback e sugestões sobre esta solução.