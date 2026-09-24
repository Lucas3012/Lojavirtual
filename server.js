const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const TelegramBotModule = require('node-telegram-bot-api');
const TelegramBot = TelegramBotModule.default || TelegramBotModule;
const cheerio = require('cheerio');

process.on('unhandledRejection', (reason, promise) => {
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
const FILE_USUARIOS = path.join(__dirname, 'usuarios.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function lerUsuarios() {
  try {
    if (!fs.existsSync(FILE_USUARIOS)) return [];
    return JSON.parse(fs.readFileSync(FILE_USUARIOS, 'utf-8') || '[]');
  } catch (err) {
    return [];
  }
}

function autenticar(req, res, next) {
  if (req.session && req.session.logado) {
    return next();
  }
  return res.redirect('/login');
}

function lerProdutos() {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8') || '[]');
  } catch (err) {
    return [];
  }
}

function salvarProdutos(produtos) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(produtos, null, 2));
    return true;
  } catch (err) {
    return false;
  }
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

async function iniciarBotComSeguranca() {
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    console.log('🔄 Fila de mensagens do Telegram limpa.');
    bot.startPolling();
    console.log('🤖 Bot do Telegram pronto para uso!');
  } catch (e) {
    console.error('Erro ao conectar bot do Telegram:', e);
  }
}

iniciarBotComSeguranca();

const usuariosSessao = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';

  try {
    if (text.toLowerCase() === '/cancelar') {
      delete usuariosSessao[chatId];
      await bot.sendMessage(chatId, '❌ Cadastro cancelado.');
      return;
    }

    if (!usuariosSessao[chatId]) {
      const matchUrl = text ? text.match(/https?:\/\/[^\s]+/) : null;
      const linkInicial = matchUrl ? matchUrl[0] : '#';

      let tituloAuto = '';

      if (linkInicial !== '#') {
        await bot.sendMessage(chatId, `🔍 *Link recebido!* Analisando página...`, { parse_mode: 'Markdown' });
        try {
          const response = await fetch(linkInicial, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' },
            redirect: 'follow'
          });
          const html = await response.text();
          const $ = cheerio.load(html);

          const ogTitle = $('meta[property="og:title"]').attr('content');
          const docTitle = $('title').text().trim();
          tituloAuto = ogTitle ? ogTitle : (docTitle ? docTitle : '');
        } catch (e) {}
      }

      usuariosSessao[chatId] = {
        step: 'titulo',
        dados: {
          titulo: tituloAuto,
          linkShopee: linkInicial.includes('shopee') || linkInicial.includes('shp.ee') ? linkInicial : '#',
          precoShopee: 0,
          fotoShopee: '',
          linkMercadoLivre: linkInicial.includes('mercadolivre') || linkInicial.includes('mercadolibre') || linkInicial.includes('meli') ? linkInicial : '#',
          precoMercadoLivre: 0,
          fotoMercadoLivre: '',
          linkTikTok: linkInicial.includes('tiktok') ? linkInicial : '#',
          precoTikTok: 0,
          fotoTikTok: '',
          imagem: '',
          categoria: 'geral'
        }
      };

      if (tituloAuto) {
        await bot.sendMessage(chatId, `✏️ *Passo 1/10: Nome do Produto*\n\nSugestão encontrada:\n_${tituloAuto}_\n\nDigite o nome ou responda *1* para usar este nome.`, { parse_mode: 'Markdown' });
      } else {
        await bot.sendMessage(chatId, `✏️ *Passo 1/10: Nome do Produto*\n\nDigite o nome/título do produto:`, { parse_mode: 'Markdown' });
      }
      return;
    }

    const sessao = usuariosSessao[chatId];

    if (sessao.step === 'titulo') {
      if (text !== '1' || !sessao.dados.titulo) {
        sessao.dados.titulo = text;
      }

      sessao.step = 'linkShopee';
      let msgShopee = `🟠 *Passo 2/10: Link da SHOPEE*\n\n`;
      if (sessao.dados.linkShopee !== '#') {
        msgShopee += `Detectado:\n\`${sessao.dados.linkShopee}\`\n\nResponda *1* para confirmar ou cole outro link (ou *0* para pular).`;
      } else {
        msgShopee += `Cole o link da *Shopee* ou digite *0* para pular:`;
      }
      await bot.sendMessage(chatId, msgShopee, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'linkShopee') {
      if (text !== '1') sessao.dados.linkShopee = extrairLink(text);

      if (sessao.dados.linkShopee !== '#') {
        sessao.step = 'precoShopee';
        await bot.sendMessage(chatId, `💰 *Passo 3/10: Preço na SHOPEE*\n\nDigite o valor (Ex: *49.90*):`, { parse_mode: 'Markdown' });
        return;
      }
      sessao.step = 'linkML';
    }

    if (sessao.step === 'precoShopee') {
      sessao.dados.precoShopee = parseFloat(text.replace(',', '.')) || 0;
      sessao.step = 'fotoShopee';
      await bot.sendMessage(chatId, `📷 *Passo 4/10: Foto do produto na SHOPEE*\n\nEnvie uma imagem do produto:`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'fotoShopee') {
      if (!msg.photo || msg.photo.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Por favor, envie uma foto em anexo.');
        return;
      }
      await bot.sendMessage(chatId, '⏳ Baixando foto...');
      const photoArray = msg.photo;
      const maiorFoto = photoArray[photoArray.length - 1];
      const localPath = await baixarImagemTelegram(maiorFoto.file_id);
      
      sessao.dados.fotoShopee = localPath;
      if (!sessao.dados.imagem) sessao.dados.imagem = localPath;

      sessao.step = 'linkML';
    }

    if (sessao.step === 'linkML') {
      if (text !== '1' && sessao.dados.linkMercadoLivre === '#') {
        sessao.dados.linkMercadoLivre = extrairLink(text);
      } else if (text !== '1' && text !== '') {
        sessao.dados.linkMercadoLivre = extrairLink(text);
      }

      let msgML = `🟡 *Passo 5/10: Link do MERCADO LIVRE*\n\n`;
      if (sessao.dados.linkMercadoLivre !== '#') {
        msgML += `Detectado:\n\`${sessao.dados.linkMercadoLivre}\`\n\nResponda *1* para confirmar ou cole outro link (ou *0* para pular).`;
        await bot.sendMessage(chatId, msgML, { parse_mode: 'Markdown' });
        sessao.step = 'confirmarML';
        return;
      } else {
        msgML += `Cole o link do *Mercado Livre* ou digite *0* para pular:`;
        await bot.sendMessage(chatId, msgML, { parse_mode: 'Markdown' });
        sessao.step = 'respostaML';
        return;
      }
    }

    if (sessao.step === 'confirmarML' || sessao.step === 'respostaML') {
      if (text !== '1') sessao.dados.linkMercadoLivre = extrairLink(text);

      if (sessao.dados.linkMercadoLivre !== '#') {
        sessao.step = 'precoML';
        await bot.sendMessage(chatId, `💰 *Passo 6/10: Preço no MERCADO LIVRE*\n\nDigite o valor (Ex: *59.90*):`, { parse_mode: 'Markdown' });
        return;
      }
      sessao.step = 'linkTikTok';
    }

    if (sessao.step === 'precoML') {
      sessao.dados.precoMercadoLivre = parseFloat(text.replace(',', '.')) || 0;
      sessao.step = 'fotoML';
      await bot.sendMessage(chatId, `📷 *Passo 7/10: Foto do produto no MERCADO LIVRE*\n\nEnvie uma imagem do produto:`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'fotoML') {
      if (!msg.photo || msg.photo.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Por favor, envie uma foto em anexo.');
        return;
      }
      await bot.sendMessage(chatId, '⏳ Baixando foto...');
      const photoArray = msg.photo;
      const maiorFoto = photoArray[photoArray.length - 1];
      const localPath = await baixarImagemTelegram(maiorFoto.file_id);
      
      sessao.dados.fotoMercadoLivre = localPath;
      if (!sessao.dados.imagem) sessao.dados.imagem = localPath;

      sessao.step = 'linkTikTok';
    }

    if (sessao.step === 'linkTikTok') {
      if (text !== '1' && sessao.dados.linkTikTok === '#') {
        sessao.dados.linkTikTok = extrairLink(text);
      } else if (text !== '1' && text !== '') {
        sessao.dados.linkTikTok = extrairLink(text);
      }

      let msgTK = `⚫ *Passo 8/10: Link do TIKTOK SHOP*\n\n`;
      if (sessao.dados.linkTikTok !== '#') {
        msgTK += `Detectado:\n\`${sessao.dados.linkTikTok}\`\n\nResponda *1* para confirmar ou cole outro link (ou *0* para pular).`;
        await bot.sendMessage(chatId, msgTK, { parse_mode: 'Markdown' });
        sessao.step = 'confirmarTikTok';
        return;
      } else {
        msgTK += `Cole o link do *TikTok Shop* ou digite *0* para pular:`;
        await bot.sendMessage(chatId, msgTK, { parse_mode: 'Markdown' });
        sessao.step = 'respostaTikTok';
        return;
      }
    }

    if (sessao.step === 'confirmarTikTok' || sessao.step === 'respostaTikTok') {
      if (text !== '1') sessao.dados.linkTikTok = extrairLink(text);

      if (sessao.dados.linkTikTok !== '#') {
        sessao.step = 'precoTikTok';
        await bot.sendMessage(chatId, `💰 *Passo 9/10: Preço no TIKTOK SHOP*\n\nDigite o valor (Ex: *39.90*):`, { parse_mode: 'Markdown' });
        return;
      }
      
      return salvarEFinalizar(chatId, sessao.dados);
    }

    if (sessao.step === 'precoTikTok') {
      sessao.dados.precoTikTok = parseFloat(text.replace(',', '.')) || 0;
      sessao.step = 'fotoTikTok';
      await bot.sendMessage(chatId, `📷 *Passo 10/10: Foto do produto no TIKTOK SHOP*\n\nEnvie uma imagem do produto:`, { parse_mode: 'Markdown' });
      return;
    }

    if (sessao.step === 'fotoTikTok') {
      if (!msg.photo || msg.photo.length === 0) {
        await bot.sendMessage(chatId, '⚠️ Por favor, envie uma foto em anexo.');
        return;
      }
      await bot.sendMessage(chatId, '⏳ Baixando foto...');
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
                 `Acesse sua vitrine: http://localhost:3000`;

  bot.sendMessage(chatId, resumo, { parse_mode: 'Markdown' });
  delete usuariosSessao[chatId];
}

// ROTAS HTTP
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));

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

app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.get('/admin', autenticar, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.get('/api/produtos', (req, res) => res.json(lerProdutos()));

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

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
