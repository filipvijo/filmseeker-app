const editorialByMovieId = {
  840326: {
    whyPicked: 'A lean, brutal, oddly funny action myth: one old prospector, stolen gold, and a Nazi platoon learning they picked the wrong man.',
    bestWatchedWhen: 'Best watched when you want something short, physical, and cathartic — a midnight-movie punch rather than a slow prestige drama.',
    ifYouLiked: ['John Wick', 'Mad Max: Fury Road', 'Inglourious Basterds']
  }
};

export const getFilmOfMonthEditorial = (movie) => {
  if (!movie) return null;

  return editorialByMovieId[movie.id] || {
    whyPicked: `${movie.title} stands out this month because it has a strong hook, clear mood, and enough personality to anchor a movie-night pick.`,
    bestWatchedWhen: 'Best watched when you want a curated choice without scrolling through endless options.',
    ifYouLiked: ['curated cinema picks', 'distinctive genre films', 'strong director-driven movies']
  };
};
