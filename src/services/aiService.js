import axios from 'axios';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

// Fetch movie poster and ID from TMDb
const fetchMoviePoster = async (title, year) => {
    try {
        const query = encodeURIComponent(title);
        const yearParam = year ? `&year=${year}` : '';
        const response = await axios.get(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}`
        );

        if (response.data.results && response.data.results.length > 0) {
            const movie = response.data.results[0];
            return {
                id: movie.id,
                poster: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : null
            };
        }
        return { id: null, poster: null };
    } catch (error) {
        console.error('Error fetching poster for:', title, error);
        return { id: null, poster: null };
    }
};

// Parse AI response into structured movie data
const parseMovieRecommendations = (text) => {
    const suggestions = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
        // Match pattern: "1. **Title (Year)** - Description - "Quote""
        // Or: "1. Title (Year) - Description - "Quote""
        const parts = line.split(' - ');
        if (parts.length >= 2) {
            let titleWithYear = parts[0].trim();

            // Remove markdown bold markers
            titleWithYear = titleWithYear.replace(/\*\*/g, '');

            // Extract quote (last part, in quotes)
            let quote = '';
            const lastPart = parts[parts.length - 1];
            const quoteMatch = lastPart.match(/"([^"]+)"/);
            if (quoteMatch) {
                quote = quoteMatch[1];
            }

            // Description is everything between title and quote
            const description = parts.slice(1, parts.length - (quote ? 1 : 0))
                .join(' - ')
                .replace(/"[^"]*"$/, '')
                .trim();

            // Parse title and year
            const titleMatch = titleWithYear.match(/^(?:\d+\.\s*)?(.*?)\s*\((\d{4})\)$/);
            if (titleMatch) {
                suggestions.push({
                    title: titleMatch[1].trim(),
                    year: titleMatch[2],
                    description: description || '',
                    quote: quote
                });
            } else {
                // Try without year
                const titleOnly = titleWithYear.replace(/^\d+\.\s*/, '').trim();
                if (titleOnly) {
                    suggestions.push({
                        title: titleOnly,
                        year: '',
                        description: description || '',
                        quote: quote
                    });
                }
            }
        }
    }

    return suggestions;
};

export const askDrFilmBot = async (userPrompt, watchedFilms, personaConfig, conversationHistory = []) => {
    try {
        const watchedTitles = watchedFilms.map(f => f.title).join(', ');

        let systemContent = personaConfig.systemPrompt;
        systemContent += `\n\nAdditional Rules:
    - You represent the "${personaConfig.name}" persona. Stay in character.
    - ALWAYS respond with exactly 5 film recommendations. Never ask for clarification — interpret the user's request as best you can and recommend films immediately.
    - Format each film as: Title (Year) - Description - "Memorable Quote"
    - Number each recommendation (1., 2., etc.)
    - Match the user's requested genre, country, mood, or style as closely as possible.
    - Do NOT recommend: ${watchedTitles}`;

        // Build messages array with full conversation history
        const messages = [
            { role: 'system', content: systemContent },
        ];

        // Add previous conversation turns (skip the initial greeting)
        for (const msg of conversationHistory) {
            if (msg.role === 'user') {
                messages.push({ role: 'user', content: msg.text });
            } else if (msg.role === 'assistant' && !msg.isError) {
                // Include the raw text or movie content so the model has context
                const content = msg.rawContent || msg.text || '';
                if (content) {
                    messages.push({ role: 'assistant', content });
                }
            }
        }

        // Add the current user message
        messages.push({ role: 'user', content: userPrompt });

        const response = await axios.post('/api/chat', {
            messages,
            max_tokens: 2048,
            temperature: 0.9,
        });

        const content = response.data.choices[0].message.content;
        console.log('Gemini raw response:', content);

        // Try to parse as movie recommendations
        const suggestions = parseMovieRecommendations(content);

        if (suggestions.length > 0) {
            // Fetch posters for all movies in parallel
            const suggestionsWithPosters = await Promise.all(
                suggestions.map(async (suggestion) => {
                    const posterData = await fetchMoviePoster(suggestion.title, suggestion.year);
                    return {
                        ...suggestion,
                        poster: posterData.poster,
                        id: posterData.id,
                    };
                })
            );

            return {
                type: 'movies',
                movies: suggestionsWithPosters,
                rawContent: content
            };
        }

        // Fallback to text if no movies parsed
        return { type: 'text', content: content };

    } catch (error) {
        console.error('AI Service Error:', error);
        if (error.response) {
            console.error("API Error Status:", error.response.status);
            console.error("API Error Data:", error.response.data);
            if (error.response.status === 401) {
                throw new Error("Invalid API Key. Please check your server environment variables.");
            } else if (error.response.status === 429) {
                throw new Error("Rate limit exceeded or insufficient quota.");
            }
        }
        throw error;
    }
};
