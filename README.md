# FamilyQuiz 🎮

Jogo de perguntas para jogar com a família e os amigos, inspirado no estilo de festa do *Conhecimento é Poder*. A tela principal fica no monitor ou na TV, e cada pessoa joga pelo celular (ou por outra aba do navegador).

## Instalar (uma vez só)

1. Instale o **Node.js** (versão LTS) em https://nodejs.org
2. Descompacte esta pasta onde quiser (ex.: `Documentos\familyquiz`).

## Jogar

**Windows:** dê dois cliques em `iniciar.bat`.
Na primeira vez ele instala o que precisa (leva 1 minuto) e depois abre a tela principal no navegador.

> Na primeira vez, o Windows pode perguntar se o Node.js pode acessar a rede. Marque **Redes privadas** e clique em **Permitir**. Sem isso, os celulares não conseguem entrar.

**Outros sistemas (ou pelo terminal):** dentro da pasta, rode `npm install` uma vez e depois `npm start`.

Para encerrar, feche a janela preta do servidor.

### Partida local (todo mundo na mesma casa)
- Deixe **🏠 Partida local** selecionado.
- Os jogadores apontam a câmera do celular para o QR code (precisam estar no mesmo Wi-Fi do PC).
- Para jogar no próprio PC, abra outra aba em `localhost:3000/jogar`. Cada aba é um jogador.

### Partida online (cada um na sua casa)
- Clique em **🌍 Partida online**. Em alguns segundos aparece um link `...trycloudflare.com/jogar`.
- Mande o link para os jogadores (WhatsApp etc.). O link só existe enquanto o jogo estiver aberto.
- Transmita a tela principal numa chamada de vídeo (Meet, Discord, WhatsApp…). O celular de cada um é só o controle.
- Dá para misturar: gente na sala usando o mesmo link e gente de fora.

## Regras rápidas

- **10 rodadas**, 1 pergunta por rodada. Cada bloco de 3 perguntas vai do fácil ao difícil.
- **Votação** nas rodadas 1, 4 e 7: 3 categorias sorteadas, a mais votada vale para o bloco. Categorias que já apareceram numa votação não voltam até a rodada final.
- **Leitura:** a pergunta aparece sozinha na tela principal por 2 s; depois as alternativas surgem nos controles e começam os 15 s.
- **Pontos:** acerto vale 500 + bônus de até 500 pela rapidez (bônus cheio até 0,5 s). Erro vale 0. O tempo conta a partir de quando as alternativas aparecem.
- **Poderes:** todos ganham 1 poder sorteado nas rodadas 1, 4 e 7 (acumulam). Use até 1 por pergunta, na janela de 5 s antes dela:
  - 🧊 **Congelar** – trava as alternativas do alvo por 2 s
  - 🫥 **Apagar vogais** – as vogais das alternativas somem
  - 🔄 **Inverter** – as alternativas aparecem de trás para frente
- **Rodada final (10ª):** quem está em 2º lugar escolhe a categoria. Pergunta difícil, sem poderes: 800 pontos por acerto + 200 para quem acertar primeiro.
- **Desempate:** quem somou menos tempo nas respostas certas.
- Caiu a conexão? Abra o link de novo no mesmo aparelho e toque em **Voltar como…**.

## Editar e criar perguntas

As perguntas ficam na pasta `perguntas/`, um arquivo por categoria. Dá para editar no Bloco de Notas, no VS Code ou direto no site do GitHub.

Cada pergunta tem este formato:

```json
{
  "dificuldade": "facil",
  "pergunta": "Em que cidade a vó nasceu?",
  "alternativas": ["Fortaleza", "Sobral", "Juazeiro do Norte", "Crato"],
  "resposta": "Sobral"
}
```

- `dificuldade`: `facil`, `media` ou `dificil`
- `alternativas`: exatamente 4
- `resposta`: o texto exato da alternativa certa. (Os arquivos prontos usam `"correta": 0` a `3`, que é a posição da certa contando do zero. Os dois jeitos funcionam.)
- Separe as perguntas com vírgula, dentro dos colchetes de `"perguntas": [ ... ]`.

**Família:** abra `perguntas/13-familia.json` e coloque as perguntas dentro de `"perguntas": []`. Ela só entra na partida se você marcar a categoria no saguão.

**Nova categoria:** copie um arquivo, mude o nome (ex.: `14-novelas.json`) e troque `categoria`, `emoji` e `ordem`.

Depois de editar, clique em **🔄 Recarregar perguntas** no saguão (ou só comece a partida, que ele recarrega sozinho). Se uma pergunta estiver com erro de formato, ela é ignorada e aparece um aviso na janela do servidor.

O histórico de perguntas já usadas fica em `dados/historico.json`. O botão **🗑️ Zerar histórico** limpa ele.

## Colocar no GitHub

1. Crie um repositório (pode ser privado) em https://github.com/new
2. Na página do repositório, use **Add file → Upload files** e envie todo o conteúdo desta pasta, **menos** `node_modules` e `dados`.
3. Para editar uma pergunta pelo site: abra o arquivo em `perguntas/`, clique no lápis ✏️, edite e clique em **Commit changes**. Depois baixe a versão nova para o PC (botão **Code → Download ZIP**, ou `git pull` se usar Git).

## Problemas comuns

- **Celular não abre o link local:** confira se está no mesmo Wi-Fi e se o Windows liberou o Node.js na rede (Painel de Controle → Firewall → Permitir um aplicativo → Node.js, marcar "Privada").
- **QR code com endereço estranho** (ex.: de VPN): desligue a VPN e reinicie o jogo.
- **Link online não aparece:** precisa de internet; tente clicar em Partida online de novo.
- **Porta ocupada:** feche outra janela do jogo que esteja aberta.
