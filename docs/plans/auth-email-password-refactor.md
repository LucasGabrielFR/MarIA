# Plano de Refatoração de Autenticação: Foco Exclusivo em E-mail e Senha

> **Objetivo:** Remover o login social do Google da interface e fluxo do aplicativo MarIA (Mobile e Web), consolidando uma experiência de autenticação exclusivamente por E-mail e Senha robusta, segura, sacra e 100% testada (Criação de Conta, Validação de Senha, Recuperação de Senha com OTP e Login).

---

## 1. Escopo das Alterações

### A. Interface e Experiência do Usuário (Flutter Mobile/Web)
1. **`login_page.dart`**:
   - Remoção do botão *"Continuar com o Google"* e do divisor *"ou continue com"*.
   - Remoção do estado `_isGoogleSubmitting` e do método `_handleGoogleLogin`.
   - Ajuste de espaçamentos para garantir proporção visual harmônica com a estética sacra (campos de E-mail, Senha, "Esqueci minha senha", botão primário "Entrar", "Não tem uma conta? Cadastre-se grátis" e "Acessar sem conta • Modo Visitante").
2. **`auth_controller.dart`**:
   - Desativação do fluxo de captura do token do Google Web OAuth no fragmento hash.
   - Tornar o método `loginWithGoogle` inativo ou descontinuado sem impactar o resto do app.
3. **`register_page.dart`**:
   - Auditoria e validação de criação de conta (Nome, Sobrenome, E-mail, Senha e Confirmação de Senha).
   - Validação da senha em tempo real com regras claras (mínimo 6 caracteres, pelo menos 2 tipos: letras, números ou símbolos).
   - Feedback visual imediato e estados de submissão/erro.
4. **`forgot_password_modal.dart`**:
   - Auditoria do fluxo de 3 passos de recuperação de senha:
     - Passo 1: Envio do e-mail para geração do OTP de 6 dígitos.
     - Passo 2: Digitação do código de 6 dígitos, nova senha (com validação de 6 caracteres e 2 tipos) e confirmação de senha.
     - Passo 3: Tela de confirmação e sucesso.
   - Validação de mensagens amigáveis em caso de código expirado ou inválido.

### B. Testes Automatizados (Dart / Flutter)
1. **`auth_test.dart`**:
   - Atualizar testes de widgets da `LoginPage` para verificar que o botão *"Continuar com o Google"* foi removido com sucesso e que apenas os elementos de E-mail/Senha estão presentes.
   - Adicionar casos de teste para o fluxo de cadastro e recuperação de senha.
   - Executar `flutter test` e `flutter analyze` para garantir zero falhas e zero warnings.

### C. Build e Verificação
1. Compilar o bundle Flutter Web (`npm run build:mobile:web`).
2. Reconstruir containers Docker caso necessário (`docker compose up --build -d`).
3. Atualizar documentação do projeto (`README.md` e `CHANGELOG.md`).

---
