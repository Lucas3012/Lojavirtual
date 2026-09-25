#!/bin/bash

echo "🧹 Encerrando processos anteriores do Node..."
pkill -f node 2>/dev/null || true

echo "🔄 Baixando alterações do GitHub..."
git pull origin main --rebase

echo "📤 Salvando e enviando alterações locais..."
git add .
git commit -m "Auto-update: ajustes do sistema" --allow-empty
git push origin main

echo "🚀 Iniciando servidor Node.js..."
node server.js &
NODE_PID=$!

sleep 3

echo "🌐 Gerando link público na internet..."
echo "----------------------------------------"
ssh -o StrictHostKeyChecking=no -R lojavirtuallk:80:localhost:3000 serveo.net

kill $NODE_PID 2>/dev/null || true
