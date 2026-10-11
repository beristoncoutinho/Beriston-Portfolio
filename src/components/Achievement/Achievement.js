import React, { useContext } from 'react';

import './Achievement.css';
import { ThemeContext } from '../../contexts/ThemeContext';
import { achievementData } from '../../data/achievementData';

function Achievement() {
    const { theme } = useContext(ThemeContext);
    const total = achievementData.achievements.length;

    // Pass the theme down as CSS variables so the CSS can tint them
    const themeVars = {
        backgroundColor: theme.secondary,
        '--primary': theme.primary,
        '--secondary': theme.secondary,
        '--tertiary': theme.tertiary,
    };

    return (
        <>
            {total > 0 && (
                <section
                    className="achievement"
                    id="achievement"
                    style={themeVars}
                >
                    {/* LEFT: label, heading, bio */}
                    <div className="achievement-body">
                        <span className="achievement-label">
                            <span className="achievement-dot" />
                            CAREER &amp; DEVELOPMENT // ACHIEVEMENTS
                        </span>

                        <h1 style={{ color: theme.primary }}>Achievements</h1>

                        <h4 style={{ color: theme.tertiary }}>
                            {achievementData.bio}
                        </h4>
                    </div>

                    {/* RIGHT: terminal window */}
                    <div className="achievement-terminal">
                        <div className="term-header">
                            <div className="term-left">
                                <span className="term-btn red" />
                                <span className="term-btn yellow" />
                                <span className="term-btn green" />
                                <span className="term-title">achievements.exe</span>
                            </div>
                            <span className="term-online">ONLINE</span>
                        </div>

                        <div className="term-body">
                            <p className="term-comment">
                                // Loading career milestones...
                            </p>

                            <p className="term-line">
                                <span className="term-prompt">user@engineer:~$</span>{' '}
                                <span className="term-cmd">ls achievements/</span>
                            </p>

                            <ul className="term-list">
                                {achievementData.achievements.map((achieve) => (
                                    <li key={achieve.id} className="term-item">
                                        <div className="term-item-title">
                                            <span className="term-arrow">&gt;</span>
                                            {achieve.title}
                                        </div>

                                        <div className="term-item-meta">
                                            {achieve.field}
                                            {achieve.field && achieve.date ? ' // ' : ''}
                                            {achieve.date}
                                        </div>

                                        {achieve.details && (
                                            <div className="term-item-details">
                                                {achieve.details}
                                            </div>
                                        )}

                                        {achieve.image && (
                                            <a
                                                className="term-cert-link"
                                                href={achieve.image}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                [ view certificate ]
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <p className="term-line">
                                <span className="term-prompt">user@engineer:~$</span>{' '}
                                <span className="term-cmd">system_status</span>
                            </p>

                            <div className="term-status">
                                <span className="achievement-dot" />
                                {total} achievements loaded. Always learning.
                            </div>
                        </div>

                        <div className="term-footer">
                            <span>SYS.ACHIEVEMENTS</span>
                            <span>CAREER // GROWTH</span>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

export default Achievement;