document.addEventListener('DOMContentLoaded', () => {
  carregarProdutosAdmin();
  inicializarMenu();
  inicializarModal();
  configurarFormulario();
});

// Carrega os cards de administração
async function carregarProdutosAdmin() {
  try {
    const res = await fetch('/api/produtos');
    const produtos = await res.json();
    renderizarProdutosAdmin(produtos);
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível carregar os produtos.'
    });
  }
}

function renderizarProdutosAdmin(produtos) {
  const container = document.getElementById('grid-admin');
  if (!container) return;
  container.innerHTML = '';

  if (produtos.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhum produto cadastrado.</p>';
    return;
  }

  produtos.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="badge ${prod.plataforma}">${prod.plataforma}</span>
        <img src="${prod.imagem}" alt="${prod.titulo}" onerror="this.src='https://via.placeholder.com/300x220?text=Sem+Imagem'">
      </div>
      <div class="card-body">
        <h3 class="titulo">${prod.titulo}</h3>
        <div class="precos"><span class="preco-atual">R$ ${prod.preco}</span></div>
        <div class="admin-actions">
          <button class="btn-editar" onclick="prepararEdicao('${prod.id}')">✏️ Editar</button>
          <button class="btn-excluir" onclick="excluirProduto('${prod.id}')">🗑️ Excluir</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Excluir produto com SweetAlert2
function excluirProduto(id) {
  Swal.fire({
    title: 'Tem certeza?',
    text: "Esta ação removerá o produto da sua vitrine!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Excluído!',
            text: 'O produto foi removido com sucesso.',
            timer: 1800,
            showConfirmButton: false
          });
          carregarProdutosAdmin();
        } else {
          throw new Error('Falha ao excluir produto.');
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: err.message
        });
      }
    }
  });
}

// Preencher formulário no modal para editar
async function prepararEdicao(id) {
  try {
    const res = await fetch('/api/produtos');
    const produtos = await res.json();
    const prod = produtos.find(p => p.id === id);

    if (!prod) return;

    document.getElementById('produto-id').value = prod.id;
    document.getElementById('titulo').value = prod.titulo;
    document.getElementById('preco').value = prod.preco;
    document.getElementById('precoAntigo').value = prod.precoAntigo || '';
    document.getElementById('imagem').value = prod.imagem;
    document.getElementById('plataforma').value = prod.plataforma;
    document.getElementById('categoria').value = prod.categoria || '';
    document.getElementById('linkAfiliado').value = prod.linkAfiliado;

    document.getElementById('modal-titulo').innerText = '✏️ Editar Produto';
    document.getElementById('modal-produto').classList.add('active');
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: 'Não foi possível carregar os dados do produto.'
    });
  }
}

// Salvar / Editar com alerta do SweetAlert2
function configurarFormulario() {
  const form = document.getElementById('form-produto');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('produto-id').value;

    const dados = {
      titulo: document.getElementById('titulo').value,
      preco: document.getElementById('preco').value,
      precoAntigo: document.getElementById('precoAntigo').value,
      imagem: document.getElementById('imagem').value,
      plataforma: document.getElementById('plataforma').value,
      categoria: document.getElementById('categoria').value || 'geral',
      linkAfiliado: document.getElementById('linkAfiliado').value
    };

    const url = id ? `/api/produtos/${id}` : '/api/produtos';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (res.ok) {
        document.getElementById('modal-produto').classList.remove('active');
        form.reset();

        Swal.fire({
          icon: 'success',
          title: id ? 'Atualizado!' : 'Cadastrado!',
          text: id ? 'Produto atualizado com sucesso.' : 'Novo produto adicionado à vitrine.',
          timer: 2000,
          showConfirmButton: false
        });

        carregarProdutosAdmin();
      } else {
        throw new Error('Erro ao processar a requisição.');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Ops...',
        text: err.message
      });
    }
  });
}

// Modal & Botão Flutuante (+)
function inicializarModal() {
  const modal = document.getElementById('modal-produto');
  const btnAbrir = document.getElementById('btn-abrir-modal');
  const btnFechar = document.getElementById('btn-fechar-modal');

  btnAbrir.addEventListener('click', () => {
    document.getElementById('form-produto').reset();
    document.getElementById('produto-id').value = '';
    document.getElementById('modal-titulo').innerText = '➕ Cadastrar Produto';
    modal.classList.add('active');
  });

  btnFechar.addEventListener('click', () => modal.classList.remove('active'));
}

// Menu Hambúrguer Universal
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
