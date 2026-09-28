/* ==========================================================
   Pokédex Clássica - Consumo da PokéAPI
   Todos os cards são criados dinamicamente com JavaScript
   (fetch + createElement + appendChild).
   ========================================================== */

// ---------- Configurações ----------
const API_URL = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 151; // 1ª geração: os Pokémon do anime de 1997
const POR_PAGINA = 20;     // quantos cards carregar por vez
const CHAVE_FAVORITOS = "pokedex-favoritos";

// Tradução dos tipos (a API retorna os nomes em inglês)
const TIPOS_PT = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico",
  grass: "Planta", ice: "Gelo", fighting: "Lutador", poison: "Venenoso",
  ground: "Terra", flying: "Voador", psychic: "Psíquico", bug: "Inseto",
  rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio",
  steel: "Aço", fairy: "Fada"
};

// ---------- Elementos do HTML ----------
const listaCards = document.getElementById("lista-cards");
const statusTexto = document.getElementById("status");
const campoBusca = document.getElementById("busca");
const filtroTipo = document.getElementById("filtro-tipo");
const botaoFavoritos = document.getElementById("botao-favoritos");
const botaoCarregar = document.getElementById("botao-carregar");

// ---------- Estado da aplicação ----------
let todosPokemon = [];      // lista básica (nome, id, url) dos 151
let pokemonFiltrados = [];  // lista após busca/filtros
let quantidadeExibida = 0;  // quantos cards já estão na tela
let idsDoTipo = null;       // ids do tipo selecionado (null = todos)
let somenteFavoritos = false;
let versaoRenderizacao = 0; // evita misturar resultados de buscas antigas
const cacheDetalhes = new Map();
const favoritos = new Set(lerFavoritos());

// ==========================================================
// 1) CONSUMO DA API COM FETCH
// ==========================================================

// Função genérica: faz a requisição e converte a resposta em JSON
function buscarJSON(url) {
  return fetch(url).then(function (resposta) {
    if (!resposta.ok) {
      throw new Error("Erro " + resposta.status + " ao acessar " + url);
    }
    return resposta.json();
  });
}

// Busca a lista dos 151 Pokémon originais
function carregarListaInicial() {
  mostrarStatus("Carregando Pokémon da PokéAPI...", "carregando");

  buscarJSON(API_URL + "/pokemon?limit=" + TOTAL_POKEMON)
    .then(function (dados) {
      console.log("Lista recebida da API:", dados);

      todosPokemon = dados.results.map(function (item) {
        return { nome: item.name, url: item.url, id: extrairId(item.url) };
      });

      aplicarFiltros();
    })
    .catch(function (erro) {
      console.error(erro);
      mostrarStatus("Não foi possível carregar os dados. Verifique sua conexão e recarregue a página.", "erro");
    });
}

// Busca os detalhes de um Pokémon (imagem, tipos, atributos...)
function buscarDetalhes(pokemon) {
  if (cacheDetalhes.has(pokemon.id)) {
    return Promise.resolve(cacheDetalhes.get(pokemon.id));
  }
  return buscarJSON(pokemon.url).then(function (dados) {
    cacheDetalhes.set(pokemon.id, dados);
    return dados;
  });
}

// Preenche o <select> com os tipos vindos da API
function carregarTipos() {
  buscarJSON(API_URL + "/type")
    .then(function (dados) {
      dados.results
        .filter(function (tipo) { return TIPOS_PT[tipo.name]; })
        .forEach(function (tipo) {
          const opcao = document.createElement("option");
          opcao.value = tipo.name;
          opcao.textContent = TIPOS_PT[tipo.name];
          filtroTipo.appendChild(opcao);
        });
    })
    .catch(function (erro) {
      console.error("Erro ao carregar tipos:", erro);
    });
}

// ==========================================================
// 2) CRIAÇÃO DINÂMICA DOS CARDS (DOM MANIPULATION)
// ==========================================================

function criarCard(pokemon) {
  // <article class="card">
  const card = document.createElement("article");
  card.className = "card";

  // Número na Pokédex (#025)
  const numero = document.createElement("span");
  numero.className = "card__numero";
  numero.textContent = "#" + String(pokemon.id).padStart(3, "0");

  // Botão de favorito (coração)
  const coracao = document.createElement("button");
  coracao.type = "button";
  coracao.className = "card__favorito";
  atualizarCoracao(coracao, pokemon.id, pokemon.name);
  coracao.addEventListener("click", function () {
    alternarFavorito(pokemon.id, coracao, card, pokemon.name);
  });

  // Nome do personagem
  const nome = document.createElement("h3");
  nome.className = "card__nome";
  nome.textContent = formatarNome(pokemon.name);

  // Imagem
  const imagem = document.createElement("img");
  imagem.className = "card__imagem";
  imagem.src = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default;
  imagem.alt = "Imagem de " + formatarNome(pokemon.name);
  imagem.loading = "lazy";

  // Tipos (status/descrição adicional)
  const tipos = document.createElement("div");
  tipos.className = "card__tipos";
  pokemon.types.forEach(function (item) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "tipo tipo--" + item.type.name;
    etiqueta.textContent = TIPOS_PT[item.type.name] || item.type.name;
    tipos.appendChild(etiqueta);
  });

  // Informações: altura, peso e habilidade
  const info = document.createElement("ul");
  info.className = "card__info";
  info.appendChild(criarItemInfo("Altura", (pokemon.height / 10).toFixed(1) + " m"));
  info.appendChild(criarItemInfo("Peso", (pokemon.weight / 10).toFixed(1) + " kg"));
  info.appendChild(criarItemInfo("Habilidade", formatarNome(pokemon.abilities[0].ability.name)));

  // Monta o card na ordem do layout
  card.appendChild(numero);
  card.appendChild(coracao);
  card.appendChild(nome);
  card.appendChild(imagem);
  card.appendChild(tipos);
  card.appendChild(info);

  // Barras de atributos (HP, Ataque e Defesa)
  ["hp", "attack", "defense"].forEach(function (chave) {
    card.appendChild(criarBarraStat(pokemon, chave));
  });

  return card;
}

function criarItemInfo(rotulo, valor) {
  const item = document.createElement("li");
  const texto = document.createElement("span");
  texto.textContent = rotulo;
  const destaque = document.createElement("strong");
  destaque.textContent = valor;
  item.append(texto, destaque);
  return item;
}

function criarBarraStat(pokemon, chave) {
  const nomes = { hp: "HP", attack: "Ataque", defense: "Defesa" };
  const stat = pokemon.stats.find(function (s) { return s.stat.name === chave; });
  const valor = stat ? stat.base_stat : 0;

  const linha = document.createElement("div");
  linha.className = "stat";

  const rotulo = document.createElement("span");
  rotulo.className = "stat__nome";
  rotulo.textContent = nomes[chave];

  const numero = document.createElement("span");
  numero.textContent = valor;

  const barra = document.createElement("div");
  barra.className = "stat__barra";
  const preenchimento = document.createElement("div");
  preenchimento.className = "stat__preenchimento";
  preenchimento.style.width = Math.min(valor / 150 * 100, 100) + "%";
  barra.appendChild(preenchimento);

  linha.append(rotulo, numero, barra);
  return linha;
}

// Carrega o próximo "lote" de cards e adiciona na tela
function carregarProximos() {
  const versao = versaoRenderizacao;
  const lote = pokemonFiltrados.slice(quantidadeExibida, quantidadeExibida + POR_PAGINA);
  if (lote.length === 0) return;

  botaoCarregar.disabled = true;
  mostrarStatus("Buscando dados em tempo real...", "carregando");

  // Faz as requisições do lote em paralelo e espera todas terminarem
  Promise.all(lote.map(buscarDetalhes))
    .then(function (listaDetalhes) {
      if (versao !== versaoRenderizacao) return; // filtro mudou nesse meio tempo

      listaDetalhes.forEach(function (pokemon) {
        const card = criarCard(pokemon);
        listaCards.appendChild(card); // insere o card no HTML
      });

      quantidadeExibida += lote.length;
      atualizarRodapeLista();
    })
    .catch(function (erro) {
      console.error(erro);
      mostrarStatus("Erro ao buscar os Pokémon. Tente novamente.", "erro");
    })
    .finally(function () {
      botaoCarregar.disabled = false;
    });
}

// ==========================================================
// 3) BUSCA, FILTROS E FAVORITOS
// ==========================================================

function aplicarFiltros() {
  const termo = campoBusca.value.trim().toLowerCase();

  pokemonFiltrados = todosPokemon.filter(function (p) {
    const combinaBusca = !termo || p.nome.includes(termo) || String(p.id) === termo.replace("#", "").replace(/^0+/, "");
    const combinaTipo = !idsDoTipo || idsDoTipo.has(p.id);
    const combinaFavorito = !somenteFavoritos || favoritos.has(p.id);
    return combinaBusca && combinaTipo && combinaFavorito;
  });

  // Limpa os cards atuais e recomeça a exibição
  versaoRenderizacao++;
  listaCards.replaceChildren();
  quantidadeExibida = 0;

  if (pokemonFiltrados.length === 0) {
    botaoCarregar.hidden = true;
    mostrarStatus(somenteFavoritos && favoritos.size === 0
      ? "Você ainda não favoritou nenhum Pokémon."
      : "Nenhum Pokémon encontrado.");
    return;
  }

  carregarProximos();
}

// Ao escolher um tipo, busca na API quais Pokémon pertencem a ele
function aoMudarTipo() {
  const tipo = filtroTipo.value;
  if (!tipo) {
    idsDoTipo = null;
    aplicarFiltros();
    return;
  }

  mostrarStatus("Buscando Pokémon do tipo " + TIPOS_PT[tipo] + "...", "carregando");
  buscarJSON(API_URL + "/type/" + tipo)
    .then(function (dados) {
      console.log("Tipo recebido da API:", dados);
      idsDoTipo = new Set(dados.pokemon.map(function (item) {
        return extrairId(item.pokemon.url);
      }));
      aplicarFiltros();
    })
    .catch(function (erro) {
      console.error(erro);
      mostrarStatus("Erro ao filtrar por tipo.", "erro");
    });
}

function alternarFavorito(id, botao, card, nome) {
  if (favoritos.has(id)) {
    favoritos.delete(id);
  } else {
    favoritos.add(id);
  }
  salvarFavoritos();
  atualizarCoracao(botao, id, nome);

  // No modo "só favoritos", remove o card desfavoritado da tela
  if (somenteFavoritos && !favoritos.has(id)) {
    card.remove();
    pokemonFiltrados = pokemonFiltrados.filter(function (p) { return p.id !== id; });
    quantidadeExibida--;
    if (pokemonFiltrados.length === 0) {
      mostrarStatus("Você ainda não favoritou nenhum Pokémon.");
    } else {
      atualizarRodapeLista();
    }
  }
}

function atualizarCoracao(botao, id, nome) {
  const favorito = favoritos.has(id);
  botao.textContent = favorito ? "♥" : "♡";
  botao.setAttribute("aria-pressed", favorito);
  botao.setAttribute("aria-label", (favorito ? "Remover " : "Favoritar ") + formatarNome(nome));
}

function lerFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS)) || [];
  } catch (erro) {
    return [];
  }
}

function salvarFavoritos() {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(Array.from(favoritos)));
  } catch (erro) {
    // Sem localStorage os favoritos valem apenas nesta visita
  }
}

// ==========================================================
// 4) FUNÇÕES AUXILIARES
// ==========================================================

// "https://pokeapi.co/api/v2/pokemon/25/" -> 25
function extrairId(url) {
  const partes = url.split("/").filter(Boolean);
  return Number(partes[partes.length - 1]);
}

// "mr-mime" -> "Mr Mime"
function formatarNome(nome) {
  return nome.split("-").map(function (parte) {
    return parte.charAt(0).toUpperCase() + parte.slice(1);
  }).join(" ");
}

function mostrarStatus(mensagem, tipo) {
  statusTexto.textContent = mensagem;
  statusTexto.className = "status" + (tipo ? " status--" + tipo + (tipo === "carregando" ? " carregando" : "") : "");
}

function atualizarRodapeLista() {
  mostrarStatus("Exibindo " + quantidadeExibida + " de " + pokemonFiltrados.length + " Pokémon");
  botaoCarregar.hidden = quantidadeExibida >= pokemonFiltrados.length;
}

// Espera o usuário parar de digitar antes de filtrar
let temporizadorBusca;
function aoDigitarBusca() {
  clearTimeout(temporizadorBusca);
  temporizadorBusca = setTimeout(aplicarFiltros, 300);
}

// ==========================================================
// 5) EVENTOS E INICIALIZAÇÃO
// ==========================================================

campoBusca.addEventListener("input", aoDigitarBusca);
filtroTipo.addEventListener("change", aoMudarTipo);
botaoCarregar.addEventListener("click", carregarProximos);
botaoFavoritos.addEventListener("click", function () {
  somenteFavoritos = !somenteFavoritos;
  botaoFavoritos.setAttribute("aria-pressed", somenteFavoritos);
  botaoFavoritos.textContent = somenteFavoritos ? "♥ Só favoritos" : "♡ Só favoritos";
  aplicarFiltros();
});

carregarTipos();
carregarListaInicial();
