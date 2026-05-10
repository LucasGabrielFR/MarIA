#!/bin/bash

# Script de Deploy para VPS (Usando PM2)

echo "🚀 Iniciando processo de deploy..."

# 1. Puxar as últimas alterações (se usando git)
echo "📦 Atualizando código fonte..."
git pull origin main

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

echo "🌐 O frontend estará disponível na porta 4173 e o backend na porta padrão (normalmente 3000)."
