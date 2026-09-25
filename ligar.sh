#!/bin/bash

echo "🧹 A encerrar obrigatoriamente todos os processos do Node.js..."
pkill -9 -f node 2>/dev/null || true
sleep 1

echo "🔄 A baixar alterações do GitHub..."
git pull origin main --rebase

echo "📤 A enviar alterações locais para o GitHub..."
git add .
git commit -m "Auto-update: correção do bot do telegram e rotas" --allow-empty
git push origin main

echo "🚀 A iniciar o servidor Node.js..."
node server.js &
NODE_PID=$!

sleep 3

echo "🌐 A gerar link público na internet..."
echo "----------------------------------------"
ssh -o StrictHostKeyChecking=no -R lojavirtuallk:80:localhost:3000 serveo.net

kill -9 $NODE_PID 2>/dev/null || true
