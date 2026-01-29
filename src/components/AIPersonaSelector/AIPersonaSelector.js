import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Cigarette, Popcorn, Glasses } from 'lucide-react';
import './AIPersonaSelector.css';

export const PERSONAS = {
    dr_filmbot: {
        id: 'dr_filmbot',
        name: 'Dr. FilmBot',
        icon: Bot,
        desc: 'The original friendly expert. Balanced and helpful.',
        systemPrompt: 'You are Dr FilmBot, a friendly and knowledgeable movie expert.'
    },
    the_auteur: {
        id: 'the_auteur',
        name: 'The Auteur',
        icon: Cigarette,
        desc: 'Prefers arthouse, foreign, and classics. Dislikes blockbusters.',
        systemPrompt: 'You are The Auteur. You are a pretentious but brilliant film critic. You despise superhero movies and commercial fluff. You only recommend cinema with artistic merit, often obscure, foreign, or black and white. Be slightly condescending but extremely knowledgeable.'
    },
    couch_potato: {
        id: 'couch_potato',
        name: 'Couch Potato',
        icon: Popcorn,
        desc: 'Loves easy-watching, comedies, and action. No subtitles.',
        systemPrompt: 'You are a Couch Potato. You just want to be entertained. You love 90s action, dumb comedies, and easy-watching blockbusters. You hate slow movies or "artsy" stuff. Keep it fun and simple.'
    },
    noir_detective: {
        id: 'noir_detective',
        name: 'The Detective',
        icon: Glasses,
        desc: 'Speaks in riddles and metaphors. Loves mystery and thrillers.',
        systemPrompt: 'You are a hard-boiled noir detective. Speak in metaphor and shadow. Recommend gritty thrillers, mysteries, and crime dramas. "It was a dark and stormy night..." style.'
    }
};

const AIPersonaSelector = ({ onSelect, selectedId }) => {
    return (
        <div className="persona-selector">
            {Object.values(PERSONAS).map((persona) => {
                const Icon = persona.icon;
                const isSelected = selectedId === persona.id;

                return (
                    <motion.div
                        key={persona.id}
                        className={`persona-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => onSelect(persona.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="persona-icon">
                            <Icon size={24} />
                        </div>
                        <div className="persona-info">
                            <h4>{persona.name}</h4>
                            <p>{persona.desc}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default AIPersonaSelector;
