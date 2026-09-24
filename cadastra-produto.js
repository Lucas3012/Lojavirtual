const http = require('http');

const novoProduto = {
  titulo: "Luminária de Mesa LED Articulada Recarregável",
  preco: 34.90,
  precoAntigo: 59.90,
  imagem: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80",
  plataforma: "shopee",
  categoria: "eletronicos",
  linkAfiliado: "https://shope.ee/seu_link_afiliado_luminaria"
};

const data = JSON.stringify(novoProduto);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/produtos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log("Enviando requisição de cadastro...");

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Resposta do Servidor:', JSON.parse(responseData));
  });
});

req.on('error', (error) => {
  console.error('Erro (o server.js está rodando?):', error.message);
});

req.write(data);
req.end();
