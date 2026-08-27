import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error("Envoi d'e-mail non configuré (variables SMTP_HOST / SMTP_USER / SMTP_PASSWORD manquantes).");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export interface PieceJointe {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export async function envoyerEmail(options: {
  to: string;
  subject: string;
  text: string;
  attachments?: PieceJointe[];
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    attachments: options.attachments,
  });
}
