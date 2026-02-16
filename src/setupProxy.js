// Local dev proxy — handles /api/chat when using `npm start` (react-scripts)
// In production on Vercel, the serverless function in api/chat.js handles this instead.
const https = require('https');
const path = require('path');

// CRA only injects REACT_APP_* vars — load .env ourselves for server-side keys
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

module.exports = function (app) {
    app.post('/api/chat', (req, res) => {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('[setupProxy] GOOGLE_API_KEY is not set in .env');
            return res.status(500).json({ error: 'Google API key not configured.' });
        }

        // Collect raw body from the request stream
        let rawBody = '';
        req.on('data', (chunk) => {
            rawBody += chunk;
        });

        req.on('end', () => {
            let parsed;
            try {
                parsed = JSON.parse(rawBody);
            } catch {
                return res.status(400).json({ error: 'Invalid JSON body.' });
            }

            const { messages, max_tokens, temperature } = parsed;

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

            const model = 'gemini-2.5-flash';
            const payload = JSON.stringify(geminiBody);

            console.log('[setupProxy] Sending request to Gemini API...');

            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            };

            const proxyReq = https.request(options, (proxyRes) => {
                let data = '';
                proxyRes.on('data', (chunk) => {
                    data += chunk;
                });
                proxyRes.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (proxyRes.statusCode !== 200) {
                            console.error('[setupProxy] Gemini API error:', proxyRes.statusCode, data);
                            return res.status(proxyRes.statusCode).json(result);
                        }
                        // Normalize to OpenAI-compatible response shape
                        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        res.status(200).json({
                            choices: [{ message: { content: text } }],
                        });
                    } catch (err) {
                        console.error('[setupProxy] Failed to parse Gemini response:', err, data);
                        res.status(500).json({ error: 'Failed to parse Gemini response.' });
                    }
                });
            });

            proxyReq.on('error', (err) => {
                console.error('[setupProxy] Proxy error:', err);
                res.status(500).json({ error: 'Failed to reach Gemini API.' });
            });

            proxyReq.write(payload);
            proxyReq.end();
        });
    });
};

