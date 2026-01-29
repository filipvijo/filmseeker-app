import React from 'react';
import { useFilm } from '../../context/FilmContext';
import './PreferencesFilter.css';

// Custom icons
import iconLength from '../../icon-length.png';
import iconMood from '../../icon-mood.png';
import iconLanguage from '../../icon-language.png';
import iconActor from '../../icon-actor.png';
import iconDirector from '../../icon-director.png';

const PreferencesFilter = () => {
    const { preferences, updatePreference } = useFilm();

    return (
        <div className="preferences-container">
            <h2 className="preferences-title">Add Your Preferences</h2>

            <div className="preferences-grid">

                {/* Duration */}
                <div className="preference-item">
                    <div className="pref-icon"><img src={iconLength} alt="Duration" /></div>
                    <label>Duration</label>
                    <select
                        value={preferences.duration}
                        onChange={(e) => updatePreference('duration', e.target.value)}
                    >
                        <option value="">Choose a duration</option>
                        <option value="short">Short (&lt; 90 min)</option>
                        <option value="medium">Medium (90-120 min)</option>
                        <option value="long">Long (&gt; 120 min)</option>
                    </select>
                </div>

                {/* Decade */}
                <div className="preference-item">
                    <div className="pref-icon"><img src={iconMood} alt="Decade" /></div>
                    <label>Decade</label>
                    <select
                        value={preferences.decade}
                        onChange={(e) => updatePreference('decade', e.target.value)}
                    >
                        <option value="">Choose a decade</option>
                        <option value="2020">2020s</option>
                        <option value="2010">2010s</option>
                        <option value="2000">2000s</option>
                        <option value="1990">1990s</option>
                        <option value="1980">1980s</option>
                        <option value="1970">1970s</option>
                        <option value="1960">1960s</option>
                        <option value="1950">1950s</option>
                    </select>
                </div>

                {/* Language */}
                <div className="preference-item">
                    <div className="pref-icon"><img src={iconLanguage} alt="Language" /></div>
                    <label>Language</label>
                    <select
                        value={preferences.language}
                        onChange={(e) => updatePreference('language', e.target.value)}
                    >
                        <option value="">Choose a language</option>
                        <option value="arabic">Arabic</option>
                        <option value="chinese">Chinese</option>
                        <option value="czech">Czech</option>
                        <option value="danish">Danish</option>
                        <option value="dutch">Dutch</option>
                        <option value="english">English</option>
                        <option value="finnish">Finnish</option>
                        <option value="french">French</option>
                        <option value="german">German</option>
                        <option value="greek">Greek</option>
                        <option value="hebrew">Hebrew</option>
                        <option value="hindi">Hindi</option>
                        <option value="hungarian">Hungarian</option>
                        <option value="indonesian">Indonesian</option>
                        <option value="italian">Italian</option>
                        <option value="japanese">Japanese</option>
                        <option value="korean">Korean</option>
                        <option value="norwegian">Norwegian</option>
                        <option value="persian">Persian</option>
                        <option value="polish">Polish</option>
                        <option value="portuguese">Portuguese</option>
                        <option value="romanian">Romanian</option>
                        <option value="russian">Russian</option>
                        <option value="serbian">Serbian</option>
                        <option value="slovak">Slovak</option>
                        <option value="spanish">Spanish</option>
                        <option value="swedish">Swedish</option>
                        <option value="thai">Thai</option>
                        <option value="turkish">Turkish</option>
                        <option value="ukrainian">Ukrainian</option>
                        <option value="vietnamese">Vietnamese</option>
                    </select>
                </div>

                {/* Actor */}
                <div className="preference-item">
                    <div className="pref-icon"><img src={iconActor} alt="Actor" /></div>
                    <label>Actress/Actor</label>
                    <input
                        type="text"
                        placeholder="Enter Actress/Actor"
                        value={preferences.actor}
                        onChange={(e) => updatePreference('actor', e.target.value)}
                    />
                </div>

                {/* Director */}
                <div className="preference-item">
                    <div className="pref-icon"><img src={iconDirector} alt="Director" /></div>
                    <label>Director</label>
                    <input
                        type="text"
                        placeholder="Enter Director"
                        value={preferences.director}
                        onChange={(e) => updatePreference('director', e.target.value)}
                    />
                </div>

            </div>
        </div>
    );
};

export default PreferencesFilter;
