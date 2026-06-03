import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('Warning: RESEND_API_KEY environment variable is not set. Email sending will fail.');
}

export const resend = new Resend(apiKey || 're_temp_holder_for_builds');
