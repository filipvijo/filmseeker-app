// This file contains the updated askDrFilmBot function to fix the issue with watched films
// being recommended again. Copy and paste this function into App.js to replace the existing one.

const askDrFilmBot = async (userPrompt) => {
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing. Please set REACT_APP_OPENAI_API_KEY in your .env file.');
    setDrFilmBotSuggestions([{ title: 'Error', description: 'OpenAI API key is missing. Please contact the administrator.', quote: '' }]);
    setIsDrFilmBotLoading(false);
    return;
  }

  setIsDrFilmBotLoading(true);
  setDrFilmBotSuggestions([]);
  try {
    // First, get a list of watched film IDs to exclude
    const watchedIds = Array.from(watchedFilmIds);
    console.log('Currently watched film IDs:', watchedIds);
    
    // Add a note to the prompt to avoid recommending watched films
    let enhancedPrompt = userPrompt;
    if (watchedIds.length > 0) {
      enhancedPrompt += "\n\nPlease recommend films I haven't seen before. Try to suggest a diverse selection of films.";
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a friendly and knowledgeable movie expert named Dr FilmBot who provides personalized film recommendations. When asked for a recommendation, suggest exactly ten diverse movies that match the user\'s mood or preferences. Try to recommend films from different eras, countries, and styles. For each movie, provide the title, year, a short description, and one memorable quote to spark interest. Format your response as a list: 1. Movie Title (Year) - Short Description - "Memorable Quote". 2. Movie Title (Year) - Short Description - "Memorable Quote". And so on. Always recommend different films each time, even for similar requests.',
          },
          { role: 'user', content: enhancedPrompt },
        ],
        max_tokens: 800,
        temperature: 0.9,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    const aiMessage = response.data.choices[0].message.content.trim();
    console.log('OpenAI raw response:', aiMessage);

    const suggestions = [];
    const lines = aiMessage.split('\n').filter(line => line.trim());
    for (const line of lines) {
      const parts = line.split(' - ');
      if (parts.length >= 3) {
        const titleWithYear = parts[0].trim();
        const quote = parts[parts.length - 1].replace(/"/g, '').trim();
        const description = parts.slice(1, parts.length - 1).join(' - ').trim();

        const titleMatch = titleWithYear.match(/^(?:\d+\.\s*)?(.*?)\s*\((\d{4})\)$/);
        if (titleMatch) {
          const title = titleMatch[1].trim();
          const year = titleMatch[2];
          suggestions.push({ title, year, description, quote });
        } else {
          console.warn(`Could not parse title and year from line: ${titleWithYear}`);
          suggestions.push({ title: titleWithYear, year: '', description, quote });
        }
      } else {
        console.warn(`Skipping malformed line: ${line}`);
      }
    }
    console.log('Parsed suggestions:', suggestions);

    if (suggestions.length === 0) {
      throw new Error('No valid movie suggestions could be parsed from the OpenAI response.');
    }

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
    console.log('Suggestions with posters:', suggestionsWithPosters);
    
    // Filter out already watched films - use direct comparison with watchedFilmIds
    const unwatchedSuggestions = suggestionsWithPosters.filter(
      suggestion => suggestion.id && !watchedFilmIds.has(suggestion.id.toString())
    );
    
    console.log('Filtered unwatched suggestions:', unwatchedSuggestions);
    
    // If we have enough unwatched suggestions, use those
    // Otherwise, request more recommendations
    if (unwatchedSuggestions.length >= 3) {
      setDrFilmBotSuggestions(unwatchedSuggestions.slice(0, 7));
    } else if (suggestionsWithPosters.length > 0) {
      // If we have some suggestions but most are watched, still show them
      // but add a message encouraging the user to ask for more diverse recommendations
      const remainingSuggestions = suggestionsWithPosters.slice(0, 7);
      setDrFilmBotSuggestions([
        ...remainingSuggestions,
        { 
          title: "Need more recommendations?", 
          description: "You've watched many of these films! Try asking for more specific or diverse recommendations.", 
          quote: "Try something like 'Show me sci-fi films from the 90s' or 'Recommend me foreign films'",
          id: null
        }
      ]);
    } else {
      setDrFilmBotSuggestions([{ 
        title: "No recommendations found", 
        description: "Try asking for a different type of film or being more specific in your request.", 
        quote: "",
        id: null
      }]);
    }
  } catch (error) {
    console.error('Error in askDrFilmBot:', error.message);
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
      if (error.response.status === 401) {
        setDrFilmBotSuggestions([{ title: 'Error', description: 'Invalid OpenAI API key. Please contact the administrator.', quote: '' }]);
      } else if (error.response.status === 429) {
        setDrFilmBotSuggestions([{ title: 'Error', description: 'Rate limit exceeded for OpenAI API. Please try again later.', quote: '' }]);
      } else {
        setDrFilmBotSuggestions([{ title: 'Error', description: `OpenAI API error: ${error.response.data.error?.message || 'Unknown error'}. Please try again.`, quote: '' }]);
      }
    } else {
      setDrFilmBotSuggestions([{ title: 'Error', description: `Failed to fetch recommendations: ${error.message}. Please try again.`, quote: '' }]);
    }
  } finally {
    setIsDrFilmBotLoading(false);
  }
};
