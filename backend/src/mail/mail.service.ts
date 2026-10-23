import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get('SMTP_PORT')) || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true para 465, false para outros
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.logger.log(
        `SMTP Mailer configurado com sucesso para o host ${host}:${port}`,
      );
    } else {
      this.logger.warn(
        'Serviço de Mail desativado: Variáveis SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) não configuradas no .env.',
      );
    }
  }

  async sendActivationEmail(
    to: string,
    code: string,
    planTier: string,
    billingCycle: string,
  ): Promise<boolean> {
    const planLabel = planTier === 'premium' ? 'Premium' : 'Básico';
    const cycleLabel = billingCycle === 'annual' ? 'Anual' : 'Mensal';
    const supportEmail = 'maria@acutistech.com.br';
    const activationLink = `https://wa.me/5562981949980?text=Quero%20ativar%20minha%20MarIA:%20${code}`;

    const from =
      this.configService.get<string>('SMTP_FROM') ||
      '"MarIA" <no-reply@maria.acutistech.com.br>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sua Assinatura da MarIA está pronta!</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #fafafc;
            color: #334155;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
            border: 1px border #f1f5f9;
          }
          .header {
            background-color: #0047AB;
            background-image: linear-gradient(135deg, #0047AB 0%, #002b66 100%);
            padding: 40px;
            text-align: center;
            color: #ffffff;
          }
          .logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid #D4AF37;
            margin-bottom: 16px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 24px;
          }
          .details {
            background-color: #f8fafc;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #e2e8f0;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .details-row:last-child {
            margin-bottom: 0;
          }
          .details-label {
            color: #64748b;
            font-weight: 500;
          }
          .details-val {
            color: #0f172a;
            font-weight: 700;
          }
          .code-box {
            text-align: center;
            background-color: #f1f5f9;
            border: 2px dashed #0047AB;
            border-radius: 16px;
            padding: 24px;
            margin: 32px 0;
          }
          .code-box p {
            margin: 0 0 8px 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            font-weight: 600;
          }
          .code-value {
            font-size: 32px;
            font-weight: 800;
            color: #0047AB;
            letter-spacing: 4px;
            font-family: 'Courier New', Courier, monospace;
          }
          .btn-container {
            text-align: center;
            margin: 32px 0;
          }
          .btn {
            display: inline-block;
            background-color: #22C55E;
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 36px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 10px 20px rgba(34, 197, 94, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .instructions {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 32px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
          }
          .footer a {
            color: #0047AB;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img class="logo" src="https://maria.acutistech.com.br/maria_logo_premium.png" alt="MarIA Logo">
            <h1>Sua MarIA está pronta!</h1>
          </div>
          <div class="content">
            <div class="greeting">Salve Maria! 🎉</div>
            <p class="instructions">
              Seu pagamento foi confirmado com sucesso. Agora, falta apenas um simples passo para você começar a conversar com a sua assistente espiritual no WhatsApp.
            </p>
            
            <div class="details">
              <div class="details-row">
                <span class="details-label">Plano Assinado:</span>
                <span class="details-val">${planLabel}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Ciclo de Faturamento:</span>
                <span class="details-val">${cycleLabel}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Status da Assinatura:</span>
                <span class="details-val" style="color: #22C55E;">Ativa</span>
              </div>
            </div>

            <div class="code-box">
              <p>Seu código de ativação</p>
              <div class="code-value">${code}</div>
            </div>

            <div class="btn-container">
              <a href="${activationLink}" class="btn" target="_blank">Ativar no WhatsApp Agora</a>
            </div>

            <p class="instructions" style="font-size: 13px; text-align: center; color: #64748b;">
              Se o botão acima não funcionar, basta abrir o seu WhatsApp e enviar a mensagem exatamente assim:<br>
              <strong>Quero ativar minha MarIA: ${code}</strong>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MarIA - Uma iniciativa Acutis Tech. Todos os direitos reservados.</p>
            <p>Precisa de ajuda? Fale conosco em <a href="mailto:${supportEmail}">${supportEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!this.transporter) {
      this.logger.warn(
        `[MOCK-EMAIL] Simulação de email de ativação enviado para ${to} | Código: ${code} | Plano: ${planTier} ${billingCycle}`,
      );
      return true;
    }

    try {
      this.logger.log(`Disparando e-mail de ativação real para ${to}...`);
      await this.transporter.sendMail({
        from,
        to,
        subject: '✨ Seu código de ativação da MarIA está aqui!',
        html: htmlContent,
        text: `Salve Maria! Seu pagamento foi confirmado. Envie este código no WhatsApp para ativar o seu plano ${planLabel} (${cycleLabel}): ${code}`,
      });
      this.logger.log(`E-mail de ativação enviado com sucesso para ${to}.`);
      return true;
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail de ativação para ${to}: ${error.message}`,
      );
      return false;
    }
  }

  async sendNewUserNotification(user: {
    name?: string | null;
    email?: string | null;
    origin?: string | null;
    created_at?: string | null;
  }): Promise<boolean> {
    const to =
      this.configService.get<string>('NEW_USER_NOTIFICATION_EMAIL') ||
      'lucasgabriel@acutistech.com.br';
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      '"MarIA" <no-reply@maria.acutistech.com.br>';
    const createdAt = user.created_at
      ? new Date(user.created_at).toLocaleString('pt-BR')
      : new Date().toLocaleString('pt-BR');
    const text = `Novo usuário criado na MarIA\n\nNome: ${user.name || 'Não informado'}\nE-mail: ${user.email || 'Não informado'}\nOrigem: ${user.origin || 'mobile'}\nCriado em: ${createdAt}`;

    if (!this.transporter) {
      this.logger.warn(
        `[MOCK-EMAIL] Notificação de novo usuário para ${to}: ${user.email || user.name || 'sem identificação'}`,
      );
      return true;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Novo usuário criado na MarIA',
        text,
        html: `<h2>Novo usuário criado na MarIA</h2><p><strong>Nome:</strong> ${user.name || 'Não informado'}</p><p><strong>E-mail:</strong> ${user.email || 'Não informado'}</p><p><strong>Origem:</strong> ${user.origin || 'mobile'}</p><p><strong>Criado em:</strong> ${createdAt}</p>`,
      });
      return true;
    } catch (error) {
      this.logger.error(`Falha ao notificar novo usuário: ${error.message}`);
      return false;
    }
  }

  /**
   * Envia e-mail oficial da MarIA com código OTP de 6 dígitos para recuperação de senha.
   */
  async sendPasswordResetOtpEmail(
    to: string,
    code: string,
    userName?: string,
  ): Promise<boolean> {
    const supportEmail = 'maria@acutistech.com.br';
    const nameDisplay = userName ? ` ${userName}` : '';
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      '"MarIA" <no-reply@maria.acutistech.com.br>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperação de Senha - MarIA</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f7fc;
            color: #334155;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 560px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0047AB;
            background-image: linear-gradient(135deg, #002D6E 0%, #0047AB 100%);
            padding: 36px 24px;
            text-align: center;
            color: #ffffff;
          }
          .logo {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            border: 2px solid #D4AF37;
            margin-bottom: 12px;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.3px;
          }
          .content {
            padding: 36px 32px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #002D6E;
            margin-bottom: 16px;
          }
          .instructions {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 24px;
          }
          .code-box {
            text-align: center;
            background-color: #F4F7FC;
            border: 2px dashed #D4AF37;
            border-radius: 16px;
            padding: 24px 16px;
            margin: 28px 0;
          }
          .code-box p {
            margin: 0 0 8px 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            font-weight: 700;
          }
          .code-value {
            font-size: 38px;
            font-weight: 800;
            color: #0047AB;
            letter-spacing: 8px;
            font-family: 'Courier New', Courier, monospace;
          }
          .timer-notice {
            margin-top: 10px;
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
          }
          .security-card {
            background-color: #f8fafc;
            border-left: 4px solid #0047AB;
            padding: 16px;
            border-radius: 8px;
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
            margin-top: 24px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
          }
          .footer a {
            color: #0047AB;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img class="logo" src="https://maria.acutistech.com.br/maria_logo_premium.png" alt="MarIA Logo">
            <h1>Recuperação de Senha</h1>
          </div>
          <div class="content">
            <div class="greeting">Salve Maria${nameDisplay}! 🙏</div>
            <p class="instructions">
              Recebemos uma solicitação para redefinir a senha de acesso da sua conta na MarIA.
              Informe o código de 6 dígitos abaixo no aplicativo para concluir a troca de senha:
            </p>
            
            <div class="code-box">
              <p>Código de Verificação</p>
              <div class="code-value">${code}</div>
              <div class="timer-notice">⏱️ Este código expira em 15 minutos</div>
            </div>

            <div class="security-card">
              🔒 <strong>Dica de Segurança:</strong> Se você não fez essa solicitação, pode ignorar este e-mail tranquilamente. Sua senha permanecerá inalterada e protegida.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MarIA - Uma iniciativa Acutis Tech. Todos os direitos reservados.</p>
            <p>Dúvidas ou suporte? Escreva para <a href="mailto:${supportEmail}">${supportEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!this.transporter) {
      this.logger.warn(
        `[MOCK-EMAIL] Simulação de email de recuperação de senha enviado para ${to} | Código OTP: ${code}`,
      );
      return true;
    }

    try {
      this.logger.log(
        `Disparando e-mail de recuperação de senha para ${to}...`,
      );
      await this.transporter.sendMail({
        from,
        to,
        subject: `🔐 Seu código de recuperação de senha da MarIA: ${code}`,
        html: htmlContent,
        text: `Salve Maria! Seu código para redefinir sua senha na MarIA é: ${code}. Válido por 15 minutos.`,
      });
      this.logger.log(`E-mail de recuperação enviado com sucesso para ${to}.`);
      return true;
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail de recuperação de senha para ${to}: ${error.message}`,
      );
      return false;
    }
  }
}
