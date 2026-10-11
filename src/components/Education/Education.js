import React, { useContext, useState, useRef } from 'react';

import { ThemeContext } from '../../contexts/ThemeContext';
import { educationData } from '../../data/educationData';

import './Education.css';

// "2021" -> 2021, "Present" -> current year, anything else -> null
const toYear = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (/present|ongoing|current/i.test(String(value))) {
        return new Date().getFullYear();
    }
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
};

function Education() {
    const { theme } = useContext(ThemeContext);
    const [activeIndex, setActiveIndex] = useState(0);
    const itemRefs = useRef([]);

    const total = educationData.length;
    if (total === 0) return null;

    const active = educationData[activeIndex];

    // Year range chart (only when every entry has usable years)
    const ranges = educationData.map((edu) => ({
        start: toYear(edu.startYear),
        end: toYear(edu.endYear),
    }));
    const canChart = ranges.every((r) => r.start !== null && r.end !== null);
    const minYear = canChart ? Math.min(...ranges.map((r) => r.start)) : 0;
    const maxYear = canChart ? Math.max(...ranges.map((r) => r.end)) : 0;
    const span = Math.max(maxYear - minYear, 1);
    const duration = canChart ? ranges[activeIndex].end - ranges[activeIndex].start : null;

    const select = (index) => {
        const next = (index + total) % total;
        setActiveIndex(next);
        if (itemRefs.current[next]) itemRefs.current[next].focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            select(activeIndex + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            select(activeIndex - 1);
        }
    };

    // Fill the timeline line down to the selected node
    const fillPercent = total > 1 ? (activeIndex / (total - 1)) * 100 : 100;

    return (
        <div
            className="education"
            id="education"
            style={{
                backgroundColor: theme.secondary,
                '--primary': theme.primary,
                '--secondary': theme.secondary,
                '--tertiary': theme.tertiary,
            }}
        >
            <div className="education-body">
                <h1 style={{ color: theme.primary }}>Education</h1>

                <div className="education-layout">
                    {/* LEFT: selectable timeline */}
                    <div
                        className="edu-timeline"
                        role="tablist"
                        aria-orientation="vertical"
                        aria-label="Education history"
                        onKeyDown={handleKeyDown}
                    >
                        <div className="edu-line">
                            <div
                                className="edu-line-fill"
                                style={{ height: `${fillPercent}%` }}
                            />
                        </div>

                        {educationData.map((edu, i) => (
                            <button
                                key={edu.id}
                                ref={(el) => (itemRefs.current[i] = el)}
                                role="tab"
                                type="button"
                                aria-selected={i === activeIndex}
                                tabIndex={i === activeIndex ? 0 : -1}
                                className={
                                    'edu-item' +
                                    (i === activeIndex ? ' is-active' : '') +
                                    (i < activeIndex ? ' is-past' : '')
                                }
                                onClick={() => setActiveIndex(i)}
                            >
                                <span className="edu-node" />
                                <span className="edu-item-text">
                                    <span className="edu-item-years">
                                        {edu.startYear} – {edu.endYear}
                                    </span>
                                    <span className="edu-item-institution">
                                        {edu.institution}.{edu.Discription}
                                        
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* RIGHT: detail panel */}
                    <div className="edu-panel" role="tabpanel">
                        <div className="edu-panel-content" key={active.id}>
                            <div className="edu-big-years">
                                <span>{active.startYear}</span>
                                <span className="edu-big-dash">–</span>
                                <span>{active.endYear}</span>
                                
                            </div>

                            <h2 className="edu-course">{active.course}</h2>
                            <p className="edu-institution">{active.institution}</p>
                            <n><p className="edu-institution">{active.Discription}</p></n>
                            {duration !== null && (
                                <p className="edu-duration">
                                    {duration} {duration === 1 ? 'year' : 'years'}
                                </p>
                            )}
                        </div>

                        {/* Year range bar: every entry is a segment, click to jump */}
                        {canChart && total > 1 && (
                            <div className="edu-range">
                                <div className="edu-range-track">
                                    {ranges.map((r, i) => (
                                        <button
                                            key={educationData[i].id}
                                            type="button"
                                            tabIndex={-1}
                                            aria-label={educationData[i].institution}
                                            title={educationData[i].institution}
                                            className={
                                                'edu-range-seg' +
                                                (i === activeIndex ? ' is-active' : '')
                                            }
                                            style={{
                                                left: `${((r.start - minYear) / span) * 100}%`,
                                                width: `${Math.max(
                                                    ((r.end - r.start) / span) * 100,
                                                    4
                                                )}%`,
                                            }}
                                            onClick={() => setActiveIndex(i)}
                                        />
                                    ))}
                                </div>
                                <div className="edu-range-labels">
                                    <span>{minYear}</span>
                                    <span>{maxYear}</span>
                                </div>
                            </div>
                        )}

                        <div className="edu-controls">
                            <button
                                type="button"
                                className="edu-arrow"
                                onClick={() => select(activeIndex - 1)}
                                aria-label="Previous"
                            >
                                &larr;
                            </button>
                            <span className="edu-count">
                                {activeIndex + 1} / {total}
                            </span>
                            <button
                                type="button"
                                className="edu-arrow"
                                onClick={() => select(activeIndex + 1)}
                                aria-label="Next"
                            >
                                &rarr;
                            </button>
                        </div>

                        {theme.eduimg && (
                            <img
                                className="edu-bg-image"
                                src={theme.eduimg}
                                alt=""
                                aria-hidden="true"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Education;