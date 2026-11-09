const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send an email, optionally with a PDF attachment.
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {string} [attachmentPath] — absolute path to PDF file
 */
const sendEmail = async (to, subject, html, attachmentPath) => {
    // Skip if SMTP not configured
    if (!process.env.SMTP_USER) {
        console.log(`📧 Email skipped (SMTP not configured): ${to} — ${subject}`);
        return;
    }

    try {
        const mailOptions = {
            from: `"EduQuiz Pro" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        if (attachmentPath) {
            mailOptions.attachments = [
                {
                    filename: path.basename(attachmentPath),
                    path: attachmentPath,
                    contentType: 'application/pdf',
                },
            ];
        }

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error('Email send failed:', error.message);
    }
};

module.exports = { sendEmail };
