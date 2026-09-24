const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FILE_USUARIOS = path.join(__dirname, 'usuarios.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function lerUsuarios() {
  try {
    if (!fs.existsSync(FILE_USUARIOS)) return [];
    return JSON.parse(fs.readFileSync(FILE_USUARIOS, 'utf-8') || '[]');
  } catch (err) {
    return [];
  }
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(FILE_USUARIOS, JSON.stringify(usuarios, null, 2));
}

rl.question('👤 Digite o nome de usuário: ', (usuario) => {
  const userTratado = usuario.trim().toLowerCase();
  
  if (!userTratado) {
    console.log('❌ Usuário inválido!');
    rl.close();
    return;
  }

  rl.question('🔑 Digite a senha: ', (senha) => {
    const senhaTratada = senha.trim();

    if (!senhaTratada) {
      console.log('❌ Senha inválida!');
      rl.close();
      return;
    }

    const usuarios = lerUsuarios();
    const index = usuarios.findIndex(u => u.usuario === userTratado);

    if (index !== -1) {
      usuarios[index].senha = senhaTratada;
      console.log(`\n🔄 Senha do usuário "${userTratado}" atualizada com sucesso!`);
    } else {
      usuarios.push({ usuario: userTratado, senha: senhaTratada });
      console.log(`\n✅ Usuário "${userTratado}" cadastrado com sucesso!`);
    }

    salvarUsuarios(usuarios);
    rl.close();
  });
});
