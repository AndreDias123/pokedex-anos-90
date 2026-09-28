# Pokédex Clássica: anos 90 e 2000

Aplicação front-end que consome a [PokéAPI](https://pokeapi.co/) e exibe os **151 Pokémon originais** do anime que estreou em 1997, em cards gerados dinamicamente com JavaScript.

Projeto acadêmico da disciplina **Web Development Front-End**, de André Felipe Dias (RA 146623), Ciência da Computação, 4º semestre.

**Site publicado:** https://andredias123.github.io/pokedex-anos-90/

## Tecnologias

- **HTML5** para a estrutura semântica da página
- **CSS3 puro** com variáveis, Flexbox, Grid, animações e media queries (sem frameworks)
- **JavaScript puro** com `fetch`, `then`/`catch`, `Promise.all`, `createElement` e `appendChild`

## Funcionalidades

- Cards criados 100% pelo JavaScript; o HTML contém apenas o container vazio `#lista-cards`
- Cada card mostra número, **nome**, **imagem**, **tipos**, altura, peso, habilidade e barras de HP/Ataque/Defesa
- Botão de **favoritar** (coração) com os favoritos salvos no `localStorage`
- **Busca** por nome ou número
- **Filtro por tipo**, com os tipos vindos da própria API (`/type`)
- Filtro **"Só favoritos"**
- Paginação com o botão **"Carregar mais"** (20 por vez)
- Indicador de carregamento e mensagens de erro
- Layout **responsivo** (celular, tablet e desktop)

## Estrutura

```
pokedex-anos-90/
├── index.html      # estrutura da página
├── css/style.css   # estilos
├── js/script.js    # consumo da API e criação dos cards
└── img/pokebola.svg
```

## Endpoints utilizados

| Endpoint | Uso |
|---|---|
| `GET /api/v2/pokemon?limit=151` | Lista dos 151 Pokémon da 1ª geração |
| `GET /api/v2/pokemon/{id}` | Detalhes: imagem, tipos, altura, peso, habilidades, atributos |
| `GET /api/v2/type` | Lista de tipos para o filtro |
| `GET /api/v2/type/{nome}` | Pokémon de um tipo específico |

A PokéAPI é gratuita, não exige cadastro nem token e aceita requisições do navegador (CORS liberado).

## Como executar

Basta abrir o arquivo `index.html` no navegador (é preciso estar conectado à internet).
Também é possível usar a extensão **Live Server** do VS Code.
