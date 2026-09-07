const editorialByMovieId = {
  14684: {
    whyPicked: 'A scholarship student wins acceptance at an elite school, then confronts antisemitism when his classmates discover he is Jewish. The drama turns belonging into a test of who will stand beside him.',
    bestWatchedWhen: 'You want a serious character drama about privilege, loyalty, and the cost of fitting in, with room for a conversation afterward.',
    ifYouLiked: ['Dead Poets Society', 'Scent of a Woman', 'Finding Forrester']
  },
  840326: {
    whyPicked: 'A lean, brutal, oddly funny action myth: one old prospector, stolen gold, and a Nazi platoon learning they picked the wrong man.',
    bestWatchedWhen: 'Best watched when you want something short, physical, and cathartic — a midnight-movie punch rather than a slow prestige drama.',
    ifYouLiked: ['John Wick', 'Mad Max: Fury Road', 'Inglourious Basterds']
  }
};

export const getFilmOfMonthEditorial = (movie) => {
  if (!movie) return null;

  return editorialByMovieId[movie.id] || null;

};
