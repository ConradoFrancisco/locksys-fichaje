export function getInvitationHtml(fullName: string, companyName: string, inviteUrl: string, tempPassword?: string): string {
  const passwordSection = tempPassword
    ? `
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Contraseña Temporal de Acceso</p>
        <code style="font-size: 18px; font-weight: 800; color: #0072ff; font-family: monospace; background: #eef6ff; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px;">${tempPassword}</code>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">Podés usar esta clave para loguearte si el botón de abajo falla o expira.</p>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a LockSys</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fa; color: #1a1f2c; margin: 0; padding: 40px 20px; width: 100%;">
  <div style="background-color: #ffffff; border-radius: 16px; max-width: 560px; margin: 0 auto; padding: 40px; box-shadow: 0 4px 12px rgba(10, 15, 25, 0.05); border: 1px solid #eef2f6;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 28px; font-weight: bold; color: #0a0f19; letter-spacing: -0.5px;">
        Lock<span style="color: #0072ff;">Sys</span>
      </div>
    </div>

    <div>
      <span style="display: inline-block; background-color: #eef6ff; color: #0072ff; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
        ${companyName}
      </span>
      <h1 style="font-size: 22px; font-weight: 600; color: #0a0f19; margin-top: 0; margin-bottom: 16px; line-height: 1.3;">
        ¡Hola, ${fullName}!
      </h1>
      <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
        Te damos la bienvenida a LockSys. Has sido invitado/a a unirte al sistema de control de accesos y fichaje de <strong>${companyName}</strong>.
      </p>
      
      ${passwordSection}

      <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
        Para configurar tu contraseña y acceder a tu cuenta, hacé clic en el siguiente botón:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="background-color: #0072ff; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px rgba(0, 114, 255, 0.15);">
          Configurar mi Contraseña
        </a>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
        Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
        <a href="${inviteUrl}" style="color: #0072ff; text-decoration: underline; word-break: break-all;">${inviteUrl}</a>
      </p>
    </div>

    <hr style="border: 0; border-top: 1px solid #eef2f6; margin: 32px 0 24px 0;" />

    <div style="font-size: 13px; color: #718096; text-align: center; line-height: 1.5;">
      <p style="margin: 0 0 8px 0;">
        Este correo fue enviado automáticamente por LockSys en representación de ${companyName}.
      </p>
      <p style="margin: 0;">
        Si no esperabas esta invitación, podés ignorar este correo de forma segura.
      </p>
    </div>
  </div>
</body>
</html>
`;
}
