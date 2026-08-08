# Nutrition Tracker

## Como subir o site (passo a passo)

### 1. Instalar dependências
Abra a pasta do projeto no terminal e rode:
```
npm install
```

### 2. Testar localmente
```
npm run dev
```
Acesse http://localhost:3000 no navegador.

### 3. Subir no GitHub
1. Vai em github.com → New repository → nome: `nutrition-tracker` → Create
2. No terminal, dentro da pasta do projeto:
```
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/nutrition-tracker.git
git push -u origin main
```

### 4. Subir no Vercel (grátis)
1. Vai em vercel.com → Sign up com GitHub
2. Clica em "New Project" → Import o repositório `nutrition-tracker`
3. Clica em Deploy → pronto!

Você vai receber um link tipo: `https://nutrition-tracker-xxx.vercel.app`

### 5. Salvar no celular como app
- Android: abre o link no Chrome → menu (3 pontinhos) → "Adicionar à tela inicial"
- iPhone: abre no Safari → compartilhar → "Adicionar à Tela de Início"

---

## Busca automática de alimentos
O site já busca automaticamente em:
- **Open Food Facts** — produtos industrializados brasileiros
- **USDA** — alimentos in natura (frango, arroz, banana, etc)

Para produtos que não encontrar (Mucilon, Tang, etc), salve uma vez na Biblioteca e nunca mais precise digitar.

---

## Estrutura de abas
- **📊 Hoje** — progresso do dia com anéis, lista de refeições
- **🍽️ Biblioteca** — seus alimentos salvos com controle de quantidade
- **🔍 Buscar** — busca automática de qualquer alimento
- **✏️ Manual** — adicionar qualquer refeição digitando os macros
"# nutrition-tracker" 
"# nutrition-tracker" 
