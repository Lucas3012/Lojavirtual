document.addEventListener('DOMContentLoaded', () => {
  // Controle do Menu Lateral
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('open');
    });

    const closeMenu = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    };

    if (menuClose) menuClose.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
  }

  // Roteamento via URL (?id=...)
  const urlParams = new URLSearchParams(window.location.search);
  const produtoId = urlParams.get('id');

  if (produtoId) {
    carregarDetalhesProduto(produtoId);
  } else {
    carregarVitrine();
  }
});

let listaProdutos = [];
let produtoAtual = null;
let carrinho = [];

function obterImagemProduto(p) {
  return p.imagem || p.fotoShopee || p.fotoMercadoLivre || p.fotoTikTok || 'https://via.placeholder.com/400?text=Sem+Imagem';
}

function obterPrecoProduto(p) {
  const precos = [p.precoShopee, p.precoMercadoLivre, p.precoTikTok, p.preco]
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v) && v > 0);
  return precos.length > 0 ? Math.min(...precos) : 0;
}

// 1. Carrega a Vitrine
async function carregarVitrine() {
  const secVitrine = document.getElementById('secao-vitrine');
  const secDetalhes = document.getElementById('secao-detalhes');
  const barraInf = document.getElementById('barra-inferior');

  if (secVitrine) secVitrine.style.display = 'grid';
  if (secDetalhes) secDetalhes.style.display = 'none';
  if (barraInf) barraInf.style.display = 'none';

  try {
    const res = await fetch('/api/produtos');
    listaProdutos = await res.json();
    localStorage.setItem('produtos_cache', JSON.stringify(listaProdutos));

    const container = document.getElementById('grid-produtos');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(listaProdutos) || listaProdutos.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #666;">Nenhum produto cadastrado no momento.</p>';
      return;
    }

    listaProdutos.forEach((p, index) => {
      const idProd = p.id || p._id || index;
      const preco = obterPrecoProduto(p);
      const imagemSrc = obterImagemProduto(p);

      container.innerHTML += `
        <div class="card-produto" onclick="verProduto('${idProd}')">
          <img src="${imagemSrc}" alt="${p.titulo || 'Produto'}">
          <div class="card-info">
            <h4 class="card-titulo">${p.titulo || 'Produto sem título'}</h4>
            <div class="card-preco">R$ ${preco.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error('Erro ao carregar a vitrine:', err);
  }
}

function verProduto(id) {
  window.location.href = `?id=${encodeURIComponent(id)}`;
}

function voltarVitrine() {
  window.location.href = '/';
}

// 2. Carrega a Tela de Detalhes
async function carregarDetalhesProduto(id) {
  const secVitrine = document.getElementById('secao-vitrine');
  const secDetalhes = document.getElementById('secao-detalhes');
  const barraInf = document.getElementById('barra-inferior');

  if (secVitrine) secVitrine.style.display = 'none';
  if (secDetalhes) secDetalhes.style.display = 'block';
  if (barraInf) barraInf.style.display = 'flex';

  let produtoEncontrado = null;

  try {
    const res = await fetch(`/api/produtos/${id}`);
    if (res.ok) produtoEncontrado = await res.json();
  } catch (e) {}

  if (!produtoEncontrado) {
    const cache = localStorage.getItem('produtos_cache');
    if (cache) {
      const produtos = JSON.parse(cache);
      produtoEncontrado = produtos.find((p, idx) => p.id == id || p._id == id || idx == id);
    }
  }

  if (produtoEncontrado) {
    exibirDadosProduto(produtoEncontrado);
  }
}

function exibirDadosProduto(p) {
  produtoAtual = p;

  const imgEl = document.getElementById('img-destaque');
  const titEl = document.getElementById('titulo-produto');
  const precoPr = document.getElementById('preco-principal');
  const precoParc = document.getElementById('preco-parcelado');

  const imagemPrincipal = obterImagemProduto(p);
  const menorPreco = obterPrecoProduto(p);

  if (imgEl) imgEl.src = imagemPrincipal;
  if (titEl) titEl.innerText = p.titulo || 'Produto';

  if (precoPr) precoPr.innerText = menorPreco.toFixed(2).replace('.', ',');
  if (precoParc) precoParc.innerText = `Ou em até 12x de R$ ${(menorPreco / 12 * 1.15).toFixed(2).replace('.', ',')}`;

  const containerThumbs = document.getElementById('var-thumbs-container');
  if (containerThumbs) {
    const fotosAdicionais = [p.fotoShopee, p.fotoMercadoLivre, p.fotoTikTok, p.imagem].filter(f => f && f.length > 0);
    const fotosUnicas = [...new Set(fotosAdicionais)];

    if (fotosUnicas.length > 0) {
      containerThumbs.innerHTML = fotosUnicas.map((f, idx) => `
        <img class="var-thumb-item ${idx === 0 ? 'active' : ''}" src="${f}" onclick="trocarImagem('${f}', this)">
      `).join('');
    } else {
      containerThumbs.innerHTML = `<img class="var-thumb-item active" src="${imagemPrincipal}" onclick="trocarImagem('${imagemPrincipal}', this)">`;
    }
  }
}

function trocarImagem(src, elemento) {
  const imgEl = document.getElementById('img-destaque');
  if (imgEl) imgEl.src = src;
  document.querySelectorAll('.var-thumb-item').forEach(el => el.classList.remove('active'));
  if (elemento) elemento.classList.add('active');
}

function adicionarProdutoAtual() {
  if (produtoAtual) {
    carrinho.push(produtoAtual);
    const countEl = document.getElementById('cart-badge-count');
    if (countEl) countEl.innerText = carrinho.length;

    if (typeof Swal !== 'undefined') {
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: 'Adicionado ao carrinho!' });
    }
  }
}

// MODAL COM BOTÕES ARREDONDADOS E ÍCONES
function abrirModalCheckout() {
  if (!produtoAtual) return;

  const p = produtoAtual;
  const linkShopee = p.linkShopee || '#';
  const linkML = p.linkMercadoLivre || '#';
  const linkTikTok = p.linkTikTok || '#';

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '<span style="font-size: 1.1rem; color: #333;">Escolha onde comprar</span>',
      html: `
        <p style="font-size: 0.85rem; color: #666; margin-bottom: 18px;">${p.titulo}</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 10px;">
          
          ${linkShopee !== '#' ? `
            <a href="${linkShopee}" target="_blank" style="text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 6px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #EE4D2D; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; box-shadow: 0 4px 8px rgba(238, 77, 45, 0.3);">
                <i class="fa-solid fa-bag-shopping"></i>
              </div>
              <span style="font-size: 11px; font-weight: 600; color: #EE4D2D;">Shopee</span>
            </a>
          ` : ''}

          ${linkML !== '#' ? `
            <a href="${linkML}" target="_blank" style="text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 6px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #FFE600; display: flex; align-items: center; justify-content: center; color: #2D3277; font-size: 22px; box-shadow: 0 4px 8px rgba(255, 230, 0, 0.4);">
                <i class="fa-solid fa-handshake"></i>
              </div>
              <span style="font-size: 11px; font-weight: 600; color: #2D3277;">M. Livre</span>
            </a>
          ` : ''}

          ${linkTikTok !== '#' ? `
            <a href="${linkTikTok}" target="_blank" style="text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 6px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #000; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);">
                <i class="fa-brands fa-tiktok"></i>
              </div>
              <span style="font-size: 11px; font-weight: 600; color: #000;">TikTok</span>
            </a>
          ` : ''}

        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Fechar',
      customClass: {
        popup: 'modal-arredondada'
      }
    });
  } else {
    window.open(linkShopee !== '#' ? linkShopee : linkML, '_blank');
  }
}

function compartilharProduto() {
  if (navigator.share) {
    navigator.share({ title: document.title, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copiado!');
  }
}
