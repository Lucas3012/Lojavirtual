document.addEventListener('DOMContentLoaded', () => {
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  });

  const modalCarrinho = document.getElementById('modal-carrinho');
  const btnAbrirCarrinho = document.getElementById('btn-abrir-carrinho');
  const btnFecharCarrinho = document.getElementById('btn-fechar-carrinho');
  const btnLimparCarrinho = document.getElementById('btn-limpar-carrinho');

  // Abrir / Fechar Modal
  if (btnAbrirCarrinho) {
    btnAbrirCarrinho.addEventListener('click', () => {
      renderizarCarrinho();
      if (modalCarrinho) modalCarrinho.classList.add('active');
    });
  }

  if (btnFecharCarrinho) {
    btnFecharCarrinho.addEventListener('click', () => {
      if (modalCarrinho) modalCarrinho.classList.remove('active');
    });
  }

  // BOTAO LIMPAR CARRINHO
  if (btnLimparCarrinho) {
    btnLimparCarrinho.addEventListener('click', () => {
      if (carrinho.length === 0) {
        Toast.fire({ icon: 'info', title: 'O carrinho já está vazio!' });
        return;
      }

      Swal.fire({
        title: 'Esvaziar Carrinho?',
        text: 'Você tem certeza que deseja remover todos os itens?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, esvaziar!',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          carrinho = [];
          salvarCarrinho();
          renderizarCarrinho();
          Toast.fire({ icon: 'success', title: 'Carrinho esvaziado!' });
        }
      });
    });
  }

  function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    const qtdEl = document.getElementById('carrinho-qtd');
    if (qtdEl) qtdEl.innerText = carrinho.length;
  }

  function renderizarCarrinho() {
    const container = document.getElementById('carrinho-itens');
    const totalEl = document.getElementById('carrinho-total-itens');
    if (!container) return;

    container.innerHTML = '';
    if (totalEl) totalEl.innerText = carrinho.length;

    if (carrinho.length === 0) {
      container.innerHTML = '<p style="color:#888; text-align: center; margin-top: 20px;">Seu carrinho está vazio.</p>';
      return;
    }

    carrinho.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'carrinho-item';
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${item.imagem || 'https://via.placeholder.com/45'}" alt="${item.titulo}">
          <div>
            <strong style="font-size: 0.85rem; display: block; color: #333;">${item.titulo}</strong>
            <span style="font-size: 0.75rem; color: #888;">${item.categoria || 'Geral'}</span>
          </div>
        </div>
        <button class="btn-remover-item" style="background: none; border: none; color: #dc2626; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
      `;

      // Remover item individual com confirmação
      div.querySelector('.btn-remover-item').addEventListener('click', () => {
        Swal.fire({
          title: 'Remover produto?',
          text: `Remover "${item.titulo}" do carrinho?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Remover',
          cancelButtonText: 'Cancelar'
        }).then((res) => {
          if (res.isConfirmed) {
            carrinho.splice(index, 1);
            salvarCarrinho();
            renderizarCarrinho();
            Toast.fire({ icon: 'success', title: 'Produto removido!' });
          }
        });
      });

      container.appendChild(div);
    });
  }

  // Carregar produtos da API na Vitrine
  function carregarVitrine() {
    fetch('/api/produtos')
      .then(r => r.json())
      .then(produtos => {
        const container = document.getElementById('vitrine-produtos');
        if (!container) return;

        container.innerHTML = '';

        if (!Array.isArray(produtos) || produtos.length === 0) {
          container.innerHTML = '<p style="color:#888;">Nenhum produto cadastrado.</p>';
          return;
        }

        produtos.forEach(p => {
          const card = document.createElement('div');
          card.style.cssText = 'background: #fff; border-radius: 8px; padding: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;';
          const img = p.imagem || 'https://via.placeholder.com/150';

          card.innerHTML = `
            <div>
              <img src="${img}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
              <strong style="font-size: 0.9rem; color: #333; display: block; margin-bottom: 5px;">${p.titulo}</strong>
            </div>
            <button class="btn-add-carrinho" style="background: #ef4444; color: #fff; border: none; padding: 8px; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 10px;">
              <i class="fa-solid fa-cart-plus"></i> Adicionar
            </button>
          `;

          card.querySelector('.btn-add-carrinho').addEventListener('click', () => {
            carrinho.push(p);
            salvarCarrinho();
            Toast.fire({ icon: 'success', title: 'Adicionado ao carrinho!' });
          });

          container.appendChild(card);
        });
      })
      .catch(() => {});
  }

  salvarCarrinho();
  carregarVitrine();
});
