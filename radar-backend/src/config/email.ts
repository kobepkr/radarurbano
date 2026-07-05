export const enviarCodigoVerificacion = async (email: string, codigo: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("⚠️ RESEND_API_KEY no configurado. Usando modo prueba.");
    return false;
  }

  console.log(`📧 Enviando email a ${email} via Resend...`);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Radar Urbano <onboarding@resend.dev>",
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
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      console.log(`✅ Email enviado a ${email}: ${data.id}`);
      return true;
    } else {
      const error: any = await response.json();
      console.error("❌ Error Resend:", JSON.stringify(error));
      return false;
    }
  } catch (error: any) {
    console.error("❌ Error enviando email:", error.message || error);
    return false;
  }
};
