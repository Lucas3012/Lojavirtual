#!/bin/bash

echo "🧹 Encerrando apenas o processo do server.js (sem afetar o WhatsApp)..."
# Procura e encerra apenas o processo que contém 'server.js'
pkill -9 -f "node server.js" 2>/dev/null || true
sleep 1

echo "🔄 Baixando alterações do GitHub..."
git pull origin main --rebase

echo "📤 Enviando alterações locais para o GitHub..."
git add .
git commit -m "Auto-update: ajustes e separação de processos" --allow-empty
git push origin main

echo "🚀 Iniciando servidor Node.js..."
node server.js &
NODE_PID=$!

sleep 3

echo "🌐 Gerando link público na internet..."
echo "----------------------------------------"
ssh -o StrictHostKeyChecking=no -R lojavirtuallk:80:localhost:3000 serveo.net

kill -9 $NODE_PID 2>/dev/null || true
