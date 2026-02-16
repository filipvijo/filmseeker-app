// Vercel Serverless Function — proxies chat requests to Google Gemini API
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Google API key not configured on server.' });
    }

    const { messages, max_tokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing or invalid "messages" in request body.' });
    }

    // Convert OpenAI-style messages to Gemini format
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const contents = chatMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const geminiBody = {
        contents,
        generationConfig: {
            maxOutputTokens: max_tokens || 2048,
            temperature: temperature ?? 0.9,
        },
    };

    if (systemMessage) {
        geminiBody.systemInstruction = {
            parts: [{ text: systemMessage.content }],
        };
    }

    try {
        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        // Normalize to OpenAI-compatible response shape so the frontend doesn't need changes
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({
            choices: [{ message: { content: text } }],
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Failed to reach Gemini API.' });
    }
}

