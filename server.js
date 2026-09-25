const express = require('express');
const path = require('path');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Arquivo de banco de dados simples (JSON)
const DATA_FILE = path.join(__dirname, 'dados.json');

// Garante a existência do arquivo de dados
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ produtos: [], categorias: [] }, null, 2));
}

function lerDados() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { produtos: [], categorias: [] };
  }
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
}

// ------------------- ROTAS API ------------------- //

// Obter Produtos
app.get('/api/produtos', (req, res) => {
  const dados = lerDados();
  res.json(dados.produtos || []);
});

// Atualizar/Salvar Produto
app.put('/api/produtos/:id', (req, res) => {
  const { id } = req.params;
  const dados = lerDados();
  const index = dados.produtos.findIndex(p => (p.id || p._id) == id);

  if (index !== -1) {
    dados.produtos[index] = { ...dados.produtos[index], ...req.body };
    salvarDados(dados);
    res.json({ success: true, produto: dados.produtos[index] });
  } else {
    res.status(404).json({ error: 'Produto não encontrado' });
  }
});

// Excluir Produto
app.delete('/api/produtos/:id', (req, res) => {
  const { id } = req.params;
  const dados = lerDados();
  dados.produtos = dados.produtos.filter(p => (p.id || p._id) != id);
  salvarDados(dados);
  res.json({ success: true });
});

// Obter Categorias
app.get('/api/categorias', (req, res) => {
  const dados = lerDados();
  res.json(dados.categorias || []);
});

// Excluir Categoria
app.delete('/api/categorias/:id', (req, res) => {
  const { id } = req.params;
  const dados = lerDados();
  dados.categorias = dados.categorias.filter(c => (c.id || c._id || c.nome || c) != id);
  salvarDados(dados);
  res.json({ success: true });
});

// Rotas de Páginas
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ------------------- BOT DO TELEGRAM ------------------- //
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'SEU_TOKEN_AQUI';

if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'SEU_TOKEN_AQUI') {
  // Inicializa SEM polling imediato para evitar conflito 409
  const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

  async function iniciarTelegramBot() {
    try {
      // Limpa qualquer webhook ou polling preso nos servidores do Telegram
      await bot.deleteWebHook({ drop_pending_updates: true });
      
      // Inicia a escuta de mensagens com segurança
      await bot.startPolling();
      console.log('🤖 Bot do Telegram ativo e sincronizado com sucesso!');

      bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        if (msg.text === '/start') {
          bot.sendMessage(chatId, 'Olá! Bem-vindo ao Bot do Achadinhos LK 🚀');
        }
      });
    } catch (err) {
      console.error('⚠️ Erro de conexão do Bot do Telegram:', err.message);
    }
  }

  iniciarTelegramBot();
} else {
  console.log('⚠️ TELEGRAM_TOKEN não configurado. O Bot do Telegram não foi iniciado.');
}

// ------------------- SERVIDOR ------------------- //
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
