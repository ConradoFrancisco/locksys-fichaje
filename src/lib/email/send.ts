import { resend } from './resend';
import { getInvitationHtml } from './templates/invitation';

export async function sendInvitationEmail(
  to: string,
  fullName: string,
  companyName: string,
  inviteUrl: string,
  tempPassword?: string
) {
  const fromEmail = process.env.RESEND_FROM_EMAIL!;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Te invitamos a unirte a LockSys - ${companyName}`,
      html: getInvitationHtml(fullName, companyName, inviteUrl, tempPassword),
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Unexpected error sending email:', err);
    return { success: false, error: err?.message || 'Error inesperado al enviar el email' };
  }
}
