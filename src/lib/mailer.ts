import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configure this with your real Gmail credentials in .env
// Note: You must use an "App Password" if you have 2FA enabled.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const geminiApiKey = process.env.GEMINI_API_KEY || '';

export type WarningEmailPreview = {
  subject: string;
  studentEmail: string;
  targetEmail: string;
  usingForwardEmail: boolean;
  weakestSubject?: string;
  weakestSubjectAttendance?: number;
  html: string;
};

function fallbackWarningEmailHtml(studentName: string, attendancePercentage: number, weakestSubject?: string, weakestSubjectAttendance?: number): string {
  const subjectNote = weakestSubject
    ? `<p>Your attendance is currently lowest in <strong>${weakestSubject}</strong>${typeof weakestSubjectAttendance === 'number' ? ` (${weakestSubjectAttendance.toFixed(1)}%)` : ''}. Please prioritize this subject in upcoming classes.</p>`
    : '';

  return `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #d32f2f;">Attendance Alert</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>This is an automated notification from the University Attendance System.</p>
        <p>Your current attendance for this course has fallen below the required threshold of 75%.</p>
        <div style="background: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;">Current Attendance: <strong style="color: #d32f2f;">${attendancePercentage.toFixed(1)}%</strong></p>
        </div>
        ${subjectNote}
        <p>Please ensure you attend the upcoming classes to avoid eligibility issues for the final examinations.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">This is a system-generated email. Please contact the registrar for any discrepancies.</p>
      </div>
    `;
}

async function buildWarningEmailHtml(studentName: string, attendancePercentage: number, weakestSubject?: string, weakestSubjectAttendance?: number): Promise<string> {
  if (!geminiApiKey) {
    return fallbackWarningEmailHtml(studentName, attendancePercentage, weakestSubject, weakestSubjectAttendance);
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      Generate a concise, professional HTML email body for a university low-attendance warning.
      Student name: ${studentName}
      Attendance percentage: ${attendancePercentage.toFixed(1)}%
      Required threshold: 75%
      ${weakestSubject ? `Subject with lowest attendance: ${weakestSubject}${typeof weakestSubjectAttendance === 'number' ? ` (${weakestSubjectAttendance.toFixed(1)}%)` : ''}` : ''}

      Constraints:
      - Return ONLY raw HTML (no markdown fences).
      - Keep it short and polite.
      - Include a clear "Current Attendance" highlight block.
      - If lowest-attendance subject is provided, mention it as an action item.
      - Mention this is an automated system notification.
    `;

    const result = await model.generateContent(prompt);
    const html = result.response.text().trim();
    if (!html) {
      return fallbackWarningEmailHtml(studentName, attendancePercentage, weakestSubject, weakestSubjectAttendance);
    }
    return html;
  } catch (error) {
    console.warn('Gemini email generation failed, using fallback template:', error);
    return fallbackWarningEmailHtml(studentName, attendancePercentage, weakestSubject, weakestSubjectAttendance);
  }
}

export async function getWarningEmailPreview(
  studentEmail: string,
  studentName: string,
  attendancePercentage: number,
  weakestSubject?: string,
  weakestSubjectAttendance?: number
): Promise<WarningEmailPreview> {
  const forwardEmail = process.env.FORWARD_EMAIL?.trim();
  const targetEmail = forwardEmail || studentEmail;
  const htmlBody = await buildWarningEmailHtml(studentName, attendancePercentage, weakestSubject, weakestSubjectAttendance);

  return {
    subject: '⚠️ IMPORTANT: Low Attendance Warning',
    studentEmail,
    targetEmail,
    usingForwardEmail: Boolean(forwardEmail),
    weakestSubject,
    weakestSubjectAttendance,
    html: htmlBody,
  };
}

export async function sendAttendanceWarning(
  studentEmail: string,
  studentName: string,
  attendancePercentage: number
): Promise<{ sent: boolean; targetEmail: string; reason?: string }> {
  const preview = await getWarningEmailPreview(studentEmail, studentName, attendancePercentage);
  const targetEmail = preview.targetEmail;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('Gmail credentials not configured. Skipping email for:', studentName);
    return { sent: false, targetEmail, reason: 'Gmail credentials not configured' };
  }

  const mailOptions = {
    from: `"University Attendance system" <${process.env.GMAIL_USER}>`,
    to: targetEmail,
    subject: preview.subject,
    html: preview.html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Warning email sent to ${studentName} (${attendancePercentage.toFixed(1)}%) -> ${targetEmail}`);
    return { sent: true, targetEmail };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { sent: false, targetEmail, reason: 'SMTP send failed' };
  }
}
