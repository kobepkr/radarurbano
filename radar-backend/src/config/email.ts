import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const enviarCodigoVerificacion = async (email: string, codigo: string) => {
  try {
    await transporter.sendMail({
      from: `"Radar Urbano" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Código de verificación - Radar Urbano",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #DC2626; margin: 0;">Radar Urbano</h1>
            <p style="color: #666; font-size: 14px;">Verificación de cuenta</p>
          </div>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 16px;">
              Tu código de verificación es:
            </p>
            <h2 style="color: #DC2626; font-size: 36px; letter-spacing: 8px; margin: 0 0 16px 0;">
              ${codigo}
            </h2>
            <p style="color: #888; font-size: 12px;">
              Este código expira en 10 minutos.<br/>
              Si no solicitaste este código, ignora este mensaje.
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error enviando email:", error);
    return false;
  }
};
