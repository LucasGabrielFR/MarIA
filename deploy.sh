#!/bin/bash
set -e

# Script de Deploy para VPS (Usando PM2)

echo "🚀 Iniciando processo de deploy..."

# 1. Puxar as últimas alterações (se usando git)
echo "📦 Verificando atualizações no código fonte..."
git fetch origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "📥 Novas alterações detectadas. Fazendo pull..."
    if ! git pull origin main; then
        echo "❌ Erro: O 'git pull' falhou (possivelmente devido a conflitos locais)."
        echo "❌ Abortando o processo de deploy para segurança."
        exit 1
    fi
    echo "✅ Código atualizado com sucesso!"
else
    echo "✅ O código já está na versão mais recente. Prosseguindo com o deploy..."
fi

# 2. Instalar dependências da raiz, frontend e backend
echo "⚙️ Instalando dependências..."
npm run install:all

# 3. Fazer o build do frontend e backend
echo "🏗️ Construindo o projeto..."
npm run build:all

# 4. Iniciar ou reiniciar com PM2
echo "🔄 Reiniciando serviços com PM2..."
if command -v pm2 &> /dev/null
then
    pm2 start ecosystem.config.js --env production
    pm2 save
    echo "✅ Deploy concluído com sucesso!"
else
    echo "⚠️ PM2 não encontrado. Instalando PM2 globalmente..."
    npm install -g pm2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    echo "✅ PM2 instalado e deploy concluído com sucesso!"
fi

echo "🌐 O frontend estará disponível na porta 4173, a landing page na porta 3001 e o backend na porta padrão (normalmente 3000)."
