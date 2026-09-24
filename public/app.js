document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  inicializarMenu();
});

// Busca e renderiza os produtos na vitrine
async function carregarProdutos() {
  try {
    const resposta = await fetch('/api/produtos');
    const produtos = await resposta.json();
    renderizarVitrine(produtos);
  } catch (erro) {
    console.error('Erro ao buscar produtos:', erro);
  }
}

function renderizarVitrine(produtos) {
  const container = document.getElementById('grid-produtos');
  if (!container) return;

  container.innerHTML = '';

  if (produtos.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhum produto cadastrado ainda.</p>';
    return;
  }

  produtos.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'card';

    const textoPlataforma = {
      shopee: 'Shopee',
      mercadolivre: 'Mercado Livre',
      tiktokshop: 'TikTok Shop'
    }[prod.plataforma] || prod.plataforma;

    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="badge ${prod.plataforma}">${textoPlataforma}</span>
        <img 
          src="${prod.imagem}" 
          alt="${prod.titulo}" 
          loading="lazy"
          onerror="this.onerror=null; this.src='https://via.placeholder.com/300x220?text=Sem+Imagem';"
        >
      </div>
      <div class="card-body">
        <div>
          <h3 class="titulo">${prod.titulo}</h3>
          <div class="precos">
            ${prod.precoAntigo ? `<span class="preco-antigo">R$ ${prod.precoAntigo}</span>` : ''}
            <span class="preco-atual">R$ ${prod.preco}</span>
          </div>
        </div>
        <a href="${prod.linkAfiliado}" target="_blank" rel="noopener noreferrer" class="btn-comprar">
          Comprar no ${textoPlataforma}
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

// Controle do Menu Hambúrguer Universal
function inicializarMenu() {
  const btnHamburger = document.getElementById('hamburger-btn');
  const sidebarMenu = document.getElementById('sidebar-menu');

  if (btnHamburger && sidebarMenu) {
    btnHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebarMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!sidebarMenu.contains(e.target) && e.target !== btnHamburger) {
        sidebarMenu.classList.remove('active');
      }
    });
  }
}
