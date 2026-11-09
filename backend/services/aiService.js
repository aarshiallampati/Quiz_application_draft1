/**
 * AI Service — OpenAI integration for wrong-answer analysis.
 * Falls back gracefully when API key is not set.
 */
const OpenAI = require('openai');

let client = null;
if (process.env.OPENAI_API_KEY) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Build YouTube search URL for a given query.
 */
function youtubeSearchUrl(query) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Generate YouTube recommendation links for a topic/concept.
 * @param {string} concept
 * @param {string} subject
 * @param {string[]} [searchTerms] - optional specific search terms from AI
 * @returns {{ title: string, url: string }[]}
 */
function generateYoutubeLinks(concept, subject, searchTerms = []) {
    if (searchTerms.length > 0) {
        return searchTerms.map((term) => ({
            title: term,
            url: youtubeSearchUrl(term),
        }));
    }

    // Fallback: generate sensible search queries
    const links = [];
    if (concept && concept !== 'General') {
        links.push({
            title: `${concept} explained`,
            url: youtubeSearchUrl(`${concept} explained tutorial`),
        });
        links.push({
            title: `${concept} examples`,
            url: youtubeSearchUrl(`${concept} examples problems`),
        });
    }
    if (subject) {
        links.push({
            title: `${subject} fundamentals`,
            url: youtubeSearchUrl(`${subject} fundamentals tutorial`),
        });
    }
    // Ensure at least one link
    if (links.length === 0) {
        links.push({
            title: 'Study resources',
            url: youtubeSearchUrl('study tips for exams'),
        });
    }
    return links.slice(0, 3); // max 3 recommendations
}

/**
 * Analyze incorrect answers and return study tips + YouTube recommendations.
 * @param {Array} wrongAnswers - [{ questionText, studentAnswer, correctAnswer, subject }]
 * @returns {Array} - [{ question, concept, whyWrong, correctExplanation, studyTip, youtubeLinks }]
 */
async function analyzeWrongAnswers(wrongAnswers) {
    if (!client || !wrongAnswers.length) {
        return fallbackAnalysis(wrongAnswers);
    }

    try {
        const prompt = wrongAnswers
            .map(
                (w, i) =>
                    `Q${i + 1}: "${w.questionText}"
Student answer: ${JSON.stringify(w.studentAnswer)}
Correct answer: ${w.correctAnswer.join(', ')}
Subject: ${w.subject}`,
            )
            .join('\n\n');

        const response = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            temperature: 0.4,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an expert tutor. For each wrong answer the student gave, return a JSON array of objects with keys: concept, whyWrong (detailed 2-3 sentence explanation of why the student\'s answer is incorrect), correctExplanation (detailed 3-4 sentence explanation of the correct answer with reasoning and examples), studyTip (specific actionable advice with recommended approach), youtubeSearchTerms (array of 2-3 specific YouTube search queries to learn this topic). Be thorough and educational in your explanations.',
                },
                { role: 'user', content: prompt },
            ],
        });

        const text = response.choices[0]?.message?.content || '[]';
        // Extract JSON from markdown fences if present
        const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        return wrongAnswers.map((w, i) => ({
            question: w.questionId,
            concept: parsed[i]?.concept || w.subject,
            whyWrong: parsed[i]?.whyWrong || 'Answer was incorrect.',
            correctExplanation: parsed[i]?.correctExplanation || w.explanation || '',
            studyTip: parsed[i]?.studyTip || `Review ${w.subject} concepts.`,
            youtubeLinks: generateYoutubeLinks(
                parsed[i]?.concept || w.subject,
                w.subject,
                parsed[i]?.youtubeSearchTerms || [],
            ),
        }));
    } catch (err) {
        console.warn('OpenAI call failed, using fallback:', err.message);
        return fallbackAnalysis(wrongAnswers);
    }
}

/**
 * Fallback analysis when OpenAI is unavailable.
 */
function fallbackAnalysis(wrongAnswers) {
    return wrongAnswers.map((w) => {
        const subject = w.subject || 'this topic';
        const correctAns = w.correctAnswer.join(', ');

        return {
            question: w.questionId,
            concept: w.subject || 'General',
            whyWrong: `The option you selected does not align with the correct answer for this question. The concept being tested here falls under "${subject}", and your response indicates a gap in understanding the core principle. Reviewing the fundamentals of ${subject} will help you identify the correct reasoning in similar questions.`,
            correctExplanation: w.explanation
                || `The correct answer is: ${correctAns}. This is because the question specifically tests your knowledge of ${subject}. Understanding the key differences between the options and knowing the underlying theory will help you recognize the right answer. Make sure to revisit the definitions, properties, and common examples related to ${subject}.`,
            studyTip: `Start by revisiting the core concepts of ${subject} from your textbook or lecture notes. Practice solving similar problems step by step. Focus on understanding WHY the correct answer works rather than just memorizing it. Try explaining the concept to someone else — teaching is one of the best ways to solidify your understanding.`,
            youtubeLinks: generateYoutubeLinks(w.subject, w.subject),
        };
    });
}

/**
 * Generate a study tip for weak topics.
 */
async function generateStudyTip(weakTopics = []) {
    if (!client || !weakTopics.length) {
        return `Focus on: ${weakTopics.join(', ')}. Practice regularly for best results.`;
    }

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            temperature: 0.6,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful college tutor. Give a concise, actionable study tip.',
                },
                {
                    role: 'user',
                    content: `A student is weak in: ${weakTopics.join(', ')}. Give one paragraph of study advice.`,
                },
            ],
        });
        return response.choices[0]?.message?.content || `Focus on: ${weakTopics.join(', ')}`;
    } catch {
        return `Focus on: ${weakTopics.join(', ')}. Practice regularly for best results.`;
    }
}

module.exports = { analyzeWrongAnswers, generateStudyTip };
