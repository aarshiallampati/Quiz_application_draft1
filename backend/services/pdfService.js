const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

/**
 * Generate a PDF result report for a graded submission.
 * @param {Object} submission — populated with student, quiz, and aiAnalysis
 * @returns {string|null} — file path of generated PDF
 */
async function generateResultPDF(submission) {
    if (!submission) return null;

    const filename = `report_${submission._id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, filename);

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // ── Header
            doc
                .fontSize(22)
                .fillColor('#0d6efd')
                .text('EduQuiz Pro', { align: 'center' })
                .fontSize(10)
                .fillColor('#666')
                .text('AI-Powered College Quiz Platform', { align: 'center' })
                .moveDown(1.5);

            // ── Divider
            doc.strokeColor('#dee2e6').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.5);

            // ── Student Info
            doc.fontSize(14).fillColor('#212529').text('Student Report', { underline: true }).moveDown(0.5);
            doc.fontSize(11).fillColor('#333');
            doc.text(`Name: ${submission.student?.name || 'N/A'}`);
            doc.text(`Email: ${submission.student?.email || 'N/A'}`);
            doc.text(`Quiz: ${submission.quiz?.title || 'N/A'}`);
            doc.text(`Subject: ${submission.quiz?.subject || 'N/A'}`);
            doc.moveDown(0.5);

            // ── Score Summary
            doc.fontSize(14).fillColor('#212529').text('Score Summary', { underline: true }).moveDown(0.5);
            doc.fontSize(11).fillColor('#333');
            doc.text(`Score: ${submission.score} / ${submission.totalMarks}`);
            doc.text(`Percentage: ${submission.percentage}%`);
            doc.text(`Result: ${submission.passed ? '✅ PASSED' : '❌ FAILED'}`);
            doc.text(`Time Taken: ${Math.floor((submission.timeTaken || 0) / 60)}m ${(submission.timeTaken || 0) % 60}s`);
            doc.moveDown(1);

            // ── Question-by-Question Review
            if (submission.answers?.length) {
                doc.fontSize(14).fillColor('#212529').text('Question Review', { underline: true }).moveDown(0.5);

                submission.answers.forEach((ans, i) => {
                    const q = ans.question; // populated
                    if (!q) return;
                    const statusIcon = ans.isCorrect ? '✅' : '❌';
                    const statusColor = ans.isCorrect ? '#198754' : '#dc3545';

                    // Check for page space
                    if (doc.y > 680) doc.addPage();

                    doc.fontSize(11).fillColor(statusColor).text(`${statusIcon} Q${i + 1}: ${q.text || 'N/A'}`, { continued: false });
                    doc.fontSize(10).fillColor('#555');

                    // Student's answer
                    const studentOpts = (ans.selectedOptions || []).map(idx => q.options?.[idx]?.text || `Option ${idx}`).join(', ');
                    doc.text(`   Your answer: ${ans.textAnswer || studentOpts || 'Not answered'}`);

                    // Correct answer
                    if (!ans.isCorrect) {
                        const correctOpts = (q.options || []).filter(o => o.isCorrect).map(o => o.text).join(', ');
                        doc.fillColor('#198754').text(`   Correct answer: ${correctOpts}`);
                    }

                    doc.fillColor('#666').text(`   Marks: ${ans.marksAwarded || 0} / ${q.marks || 1}`);
                    doc.moveDown(0.3);
                });
                doc.moveDown(0.5);
            }

            // ── Wrong Answer Analysis + YouTube Recommendations
            if (submission.aiAnalysis?.length) {
                if (doc.y > 600) doc.addPage();
                doc.fontSize(14).fillColor('#212529').text('Wrong Answer Analysis & Study Resources', { underline: true }).moveDown(0.5);

                submission.aiAnalysis.forEach((analysis, i) => {
                    if (doc.y > 650) doc.addPage();

                    doc.fontSize(11).fillColor('#dc3545').text(`${i + 1}. Concept: ${analysis.concept || 'N/A'}`);
                    doc.fontSize(10).fillColor('#333');
                    doc.text(`   Why Wrong: ${analysis.whyWrong || ''}`);
                    doc.text(`   Correct Explanation: ${analysis.correctExplanation || ''}`);
                    doc.fillColor('#198754').text(`   💡 Study Tip: ${analysis.studyTip || ''}`);

                    // YouTube Recommendations
                    if (analysis.youtubeLinks?.length) {
                        doc.moveDown(0.2);
                        doc.fontSize(10).fillColor('#0d6efd').text('   🎥 Recommended Videos:');
                        analysis.youtubeLinks.forEach((link) => {
                            doc.fontSize(9).fillColor('#0d6efd').text(`      • ${link.title}`, {
                                link: link.url,
                                underline: true,
                            });
                        });
                    }

                    doc.moveDown(0.5);
                });
            }

            // ── Footer
            doc.moveDown(1);
            if (doc.y > 750) doc.addPage();
            doc.strokeColor('#dee2e6').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.5);
            doc
                .fontSize(9)
                .fillColor('#999')
                .text(`Generated on ${new Date().toLocaleString()} — EduQuiz Pro`, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateResultPDF };
