import { resend } from './resend';
import { getInvitationHtml } from './templates/invitation';

export async function sendInvitationEmail(
  to: string,
  fullName: string,
  companyName: string,
  inviteUrl: string,
  tempPassword?: string
) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'LockSys <onboarding@resend.dev>';

  // En desarrollo, Resend solo permite enviar al email del propietario de la cuenta.
  // Si definís RESEND_TEST_EMAIL en .env.local, todos los mails se redirigen ahí.
  const recipient = process.env.RESEND_TEST_EMAIL || to;
  const isDev = !!process.env.RESEND_TEST_EMAIL;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipient,
      subject: `${isDev ? `[TEST → ${to}] ` : ''}Te invitamos a unirte a LockSys - ${companyName}`,
      html: getInvitationHtml(fullName, companyName, inviteUrl, tempPassword),
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      return { success: false, error: error.message };
    }

    if (isDev) {
      console.log(`[Email Dev] Mail para ${to} redirigido a ${recipient}`);
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Unexpected error sending email:', err);
    return { success: false, error: err?.message || 'Error inesperado al enviar el email' };
  }
}
