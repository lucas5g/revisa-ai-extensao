# PRD — RevisaAI

## 1. Visão do Produto

RevisaAI é uma extensão de navegador que permite corrigir ortografia e melhorar textos diretamente em campos de digitação na web usando Inteligência Artificial.

Quando o usuário estiver digitando em um campo de texto (input, textarea ou contenteditable), a extensão exibirá um ícone de revisão. Ao clicar nele, o texto será enviado para um modelo de IA que retornará:

- Correção ortográfica
- Correção gramatical
- Sugestão de melhoria de escrita

Inicialmente a extensão utilizará a API da Groq para processar as correções.

---

# 2. Problema

Usuários escrevem textos constantemente em diversos sites, como:

- emails
- redes sociais
- formulários
- chats
- ferramentas de documentação

Normalmente não possuem uma forma rápida de revisar ou melhorar o texto sem sair da página ou copiar para outra ferramenta.

---

# 3. Objetivo do Produto

Criar uma extensão leve que permita:

- corrigir ortografia
- melhorar textos
- funcionar em qualquer site
- utilizar a própria chave de API do usuário

---

# 4. Público-Alvo

- desenvolvedores
- estudantes
- criadores de conteúdo
- profissionais que escrevem frequentemente online

---

# 5. Funcionalidades

## 5.1 Correção de texto em qualquer campo

A extensão deve detectar automaticamente os seguintes elementos da página:

- textarea
- input[type="text"]
- elementos com contenteditable="true"

Quando o usuário estiver digitando em um desses campos, deve aparecer um ícone flutuante do RevisaAI próximo ao campo.

Ao clicar no ícone:

1. o texto do campo é capturado
2. o texto é enviado para a IA
3. a sugestão de correção é retornada

---

## 5.2 Sugestões da IA

A IA deve retornar:

- texto corrigido
- opcionalmente uma explicação da correção

### Exemplo

Entrada:eu fui na loja ontem compra um celular
Saída: Eu fui à loja ontem comprar um celular.


---

## 5.3 Aplicar correção

Após a resposta da IA, o usuário poderá:

- Substituir o texto atual pelo texto corrigido
- Copiar o texto sugerido
- Cancelar a operação

---

## 5.4 Configuração da extensão

A extensão deve possuir uma página de configurações.

Campos de configuração:

| Campo | Descrição |
|------|------|
| API Key | chave da API da Groq |
| Modelo | modelo de IA utilizado |
| Idioma padrão | idioma da revisão |

### Exemplo inicial

- API Key: chave fornecida pelo usuário
- Modelo: llama3-70b
- Idioma: português

---

# 6. Integração com IA

A extensão utilizará inicialmente a API da Groq.

Fluxo:

1. Capturar texto do campo
2. Enviar para endpoint de chat completion
3. Receber resposta da IA
4. Exibir sugestão para o usuário

### Prompt para correção ortográfica
