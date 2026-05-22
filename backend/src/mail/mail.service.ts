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
      this.logger.log(`SMTP Mailer configurado com sucesso para o host ${host}:${port}`);
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

    const from = this.configService.get<string>('SMTP_FROM') || '"MarIA" <no-reply@maria.acutistech.com.br>';

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
      this.logger.error(`Falha ao enviar e-mail de ativação para ${to}: ${error.message}`);
      return false;
    }
  }
}
