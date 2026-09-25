const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const TelegramBotModule = require('node-telegram-bot-api');
const TelegramBot = TelegramBotModule.default || TelegramBotModule;

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Rejeição Não Tratada:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Exceção Não Capturada:', err);
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'achadinhos_lk_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));

const FILE_PATH = path.join(__dirname, 'produtos.json');
const FILE_CATEGORIAS = path.join(__dirname, 'categorias.json');
const FILE_USUARIOS = path.join(__dirname, 'usuarios.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function lerDados(arquivo) {
  try {
    if (!fs.existsSync(arquivo)) return [];
    return JSON.parse(fs.readFileSync(arquivo, 'utf-8') || '[]');
  } catch (err) {
    return [];
  }
}

function salvarDados(arquivo, dados) {
  try {
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}

function lerUsuarios() {
  return lerDados(FILE_USUARIOS);
}

function lerProdutos() {
  return lerDados(FILE_PATH);
}

function salvarProdutos(produtos) {
  return salvarDados(FILE_PATH, produtos);
}

function autenticar(req, res, next) {
  if (req.session && req.session.logado) {
    return next();
  }
  return res.redirect('/login');
}

function extrairLink(texto) {
  if (texto === '0' || texto.toLowerCase() === 'pular') return '#';
  const match = texto.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : '#';
}

async function baixarImagemTelegram(fileId) {
  const fileLink = await bot.getFileLink(fileId);
  const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  const response = await fetch(fileLink);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${fileName}`;
}

const TELEGRAM_TOKEN = '8940555284:AAGac5WxNSGApnjF8io2rFGQhvwF_yfdTII'; 
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

const usuariosSessao = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';

  try {
    if (text.toLowerCase() === '/cancelar' || text.toLowerCase() === '/start') {
      delete usuariosSessao[chatId];
      await bot.sendMessage(chatId, '🔄 *Cadastro reiniciado!*\n\nEnvie o **Nome do Produto** para começar:', { parse_mode: 'Markdown' });
      return;
    }

    if (!usuariosSessao[chatId]) {
      usuariosSessao[chatId] = {
        step: 'linkShopee',
        dados: {
          titulo: text,
          linkShopee: '#',
          precoShopee: 0,
          fotoShopee: '',
          linkMercadoLivre: '#',
          precoMercadoLivre: 0,
          fotoMercadoLivre: '',
          linkTikTok: '#',
          precoTikTok: 0,
          fotoTikTok: '',
          imagem: '',
          categoria: 'geral'
        }
      };

      await bot.sendMessage(chatId, `✅ *Nome:* "${text}"\n\n🟠 *Passo 2/10: Link da SHOPEE*\nCole o link da Shopee (ou digite *0* para pular):`, { parse_mode: 'Markdown' });
      return;
    }

    const sessao = usuariosSessao[chatId];

    if (sessao.step === 'linkShopee') {
      sessao.dados.linkShopee = extrairLink(text);

      if (sessao.dados.linkShopee !== '#') {
        sessao.step = 'precoShopee';
        await bot.sendMessage(chatId, `💰 *Passo 3/10: Preço na SHOPEE*\nDigite o valor (Ex: *49.90*):`, { parse_mode: 'Markdown' });
        return;
      }
      
      sessao.step = 'linkML';
      await bot.sendMessage(chatId, `🟡 *Passo 5/10: Link do MERCADO LIVRE*\nCole o link do Mercado Livre (ou digite *0* para pular):`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'precoShopee') {
      sessao.dados.precoShopee = parseFloat(text.replace(',', '.')) || 0;
      sessao.step = 'fotoShopee';
      await bot.sendMessage(chatId, `📷 *Passo 4/10: Foto do produto na SHOPEE*\nEnvie uma imagem em anexo:`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'fotoShopee') {
      if (!msg.photo || msg.photo.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Envie uma foto em anexo para prosseguir.');
        return;
      }
      const photoArray = msg.photo;
      const maiorFoto = photoArray[photoArray.length - 1];
      const localPath = await baixarImagemTelegram(maiorFoto.file_id);
      
      sessao.dados.fotoShopee = localPath;
      if (!sessao.dados.imagem) sessao.dados.imagem = localPath;

      sessao.step = 'linkML';
      await bot.sendMessage(chatId, `🟡 *Passo 5/10: Link do MERCADO LIVRE*\nCole o link do Mercado Livre (ou digite *0* para pular):`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'linkML') {
      sessao.dados.linkMercadoLivre = extrairLink(text);

      if (sessao.dados.linkMercadoLivre !== '#') {
        sessao.step = 'precoML';
        await bot.sendMessage(chatId, `💰 *Passo 6/10: Preço no MERCADO LIVRE*\nDigite o valor (Ex: *59.90*):`, { parse_mode: 'Markdown' });
        return;
      }

      sessao.step = 'linkTikTok';
      await bot.sendMessage(chatId, `⚫ *Passo 8/10: Link do TIKTOK SHOP*\nCole o link do TikTok Shop (ou digite *0* para pular):`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'precoML') {
      sessao.dados.precoMercadoLivre = parseFloat(text.replace(',', '.')) || 0;
      sessao.step = 'fotoML';
      await bot.sendMessage(chatId, `📷 *Passo 7/10: Foto do produto no MERCADO LIVRE*\nEnvie uma imagem em anexo:`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'fotoML') {
      if (!msg.photo || msg.photo.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Envie uma foto em anexo para prosseguir.');
        return;
      }
      const photoArray = msg.photo;
      const maiorFoto = photoArray[photoArray.length - 1];
      const localPath = await baixarImagemTelegram(maiorFoto.file_id);
      
      sessao.dados.fotoMercadoLivre = localPath;
      if (!sessao.dados.imagem) sessao.dados.imagem = localPath;

      sessao.step = 'linkTikTok';
      await bot.sendMessage(chatId, `⚫ *Passo 8/10: Link do TIKTOK SHOP*\nCole o link do TikTok Shop (ou digite *0* para pular):`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'linkTikTok') {
      sessao.dados.linkTikTok = extrairLink(text);

      if (sessao.dados.linkTikTok !== '#') {
        sessao.step = 'precoTikTok';
        await bot.sendMessage(chatId, `💰 *Passo 9/10: Preço no TIKTOK SHOP*\nDigite o valor (Ex: *39.90*):`, { parse_mode: 'Markdown' });
        return;
      }

      return salvarEFinalizar(chatId, sessao.dados);
    }

    if (sessao.step === 'precoTikTok') {
      sessao.dados.precoTikTok = parseFloat(text.replace(',', '.')) || 0;
      sessao.step = 'fotoTikTok';
      await bot.sendMessage(chatId, `📷 *Passo 10/10: Foto do produto no TIKTOK SHOP*\nEnvie uma imagem em anexo:`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'fotoTikTok') {
      if (!msg.photo || msg.photo.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Envie uma foto em anexo para prosseguir.');
        return;
      }
      const photoArray = msg.photo;
      const maiorFoto = photoArray[photoArray.length - 1];
      const localPath = await baixarImagemTelegram(maiorFoto.file_id);
      
      sessao.dados.fotoTikTok = localPath;
      if (!sessao.dados.imagem) sessao.dados.imagem = localPath;

      return salvarEFinalizar(chatId, sessao.dados);
    }

  } catch (err) {
    console.error('Erro no processamento do bot:', err);
  }
});

function salvarEFinalizar(chatId, dados) {
  const produtos = lerProdutos();
  const novoProduto = {
    id: Date.now(),
    ...dados
  };

  produtos.unshift(novoProduto);
  salvarProdutos(produtos);

  const resumo = `🎉 *PRODUTO CADASTRADO COM SUCESSO!*\n\n` +
                 `📌 *Título:* ${novoProduto.titulo}\n` +
                 `🟠 *Shopee:* ${novoProduto.linkShopee !== '#' ? 'R$ ' + (novoProduto.precoShopee || 0).toFixed(2) : 'Não'}\n` +
                 `🟡 *M. Livre:* ${novoProduto.linkMercadoLivre !== '#' ? 'R$ ' + (novoProduto.precoMercadoLivre || 0).toFixed(2) : 'Não'}\n` +
                 `⚫ *TikTok:* ${novoProduto.linkTikTok !== '#' ? 'R$ ' + (novoProduto.precoTikTok || 0).toFixed(2) : 'Não'}\n\n` +
                 `Acesse sua vitrine para ver o resultado!`;

  bot.sendMessage(chatId, resumo, { parse_mode: 'Markdown' });
  delete usuariosSessao[chatId];
}

// ROTAS HTTP DE PÁGINAS
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', autenticar, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ROTAS DE API DA AUTENTICAÇÃO
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const usuarios = lerUsuarios();
  
  const usuarioEncontrado = usuarios.find(
    u => u.usuario === (usuario || '').trim().toLowerCase() && u.senha === (senha || '').trim()
  );

  if (usuarioEncontrado) {
    req.session.logado = true;
    req.session.usuario = usuarioEncontrado.usuario;
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ROTAS DE API DE PRODUTOS
app.get('/api/produtos', (req, res) => res.json(lerProdutos()));

// Rota adicionada para busca individual por ID (Necessária para a tela de detalhes)
app.get('/api/produtos/:id', (req, res) => {
  const produtos = lerProdutos();
  const idBusca = req.params.id;
  const produto = produtos.find((p, index) => p.id == idBusca || p._id == idBusca || index == idBusca);

  if (produto) {
    res.json(produto);
  } else {
    res.status(404).json({ success: false, message: 'Produto não encontrado' });
  }
});

app.post('/api/produtos', autenticar, (req, res) => {
  const produtos = lerProdutos();
  const novoProduto = { 
    id: Date.now(), 
    ...req.body, 
    precoShopee: parseFloat(req.body.precoShopee) || 0,
    precoMercadoLivre: parseFloat(req.body.precoMercadoLivre) || 0,
    precoTikTok: parseFloat(req.body.precoTikTok) || 0
  };
  produtos.unshift(novoProduto);
  salvarProdutos(produtos);
  res.status(201).json({ success: true, produto: novoProduto });
});

app.put('/api/produtos/:id', autenticar, (req, res) => {
  let produtos = lerProdutos();
  const id = parseInt(req.params.id);
  produtos = produtos.map(p => p.id === id ? { 
    ...p, 
    ...req.body, 
    id, 
    precoShopee: parseFloat(req.body.precoShopee) || 0,
    precoMercadoLivre: parseFloat(req.body.precoMercadoLivre) || 0,
    precoTikTok: parseFloat(req.body.precoTikTok) || 0
  } : p);
  salvarProdutos(produtos);
  res.json({ success: true });
});

app.delete('/api/produtos/:id', autenticar, (req, res) => {
  let produtos = lerProdutos();
  produtos = produtos.filter(p => p.id !== parseInt(req.params.id));
  salvarProdutos(produtos);
  res.json({ success: true });
});

// ROTAS DE API DE CATEGORIAS
app.get('/api/categorias', (req, res) => res.json(lerDados(FILE_CATEGORIAS)));

app.post('/api/categorias', autenticar, (req, res) => {
  const categorias = lerDados(FILE_CATEGORIAS);
  const novaCategoria = { id: Date.now(), ...req.body };
  categorias.unshift(novaCategoria);
  salvarDados(FILE_CATEGORIAS, categorias);
  res.status(201).json({ success: true, categoria: novaCategoria });
});

app.delete('/api/categorias/:id', autenticar, (req, res) => {
  let categorias = lerDados(FILE_CATEGORIAS);
  categorias = categorias.filter(c => c.id !== parseInt(req.params.id));
  salvarDados(FILE_CATEGORIAS, categorias);
  res.json({ success: true });
});

const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    await bot.startPolling();
    console.log('🤖 Bot do Telegram ativo!');
  } catch (err) {
    console.error('⚠️ Erro ao iniciar Polling:', err.message);
  }
});
