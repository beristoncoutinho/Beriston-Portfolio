import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi';

import { ThemeContext } from '../../contexts/ThemeContext';
import { projectsData } from '../../data/projectsData';

import './Projects.css';

// How many projects show on the home page (rest go to /projects)
const FEATURED_COUNT = 3;

const getTags = (tags) => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string' && tags.trim()) {
        return tags.split(',').map((t) => t.trim());
    }
    return [];
};

function Projects() {
    const { theme } = useContext(ThemeContext);
    const [activeIndex, setActiveIndex] = useState(0);

    if (projectsData.length === 0) return null;

    const featured = projectsData.slice(0, FEATURED_COUNT);

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveIndex(index);
        }
    };

    return (
        <div
            className="projects"
            id="projects"
            style={{
                backgroundColor: theme.secondary,
                '--primary': theme.primary,
                '--secondary': theme.secondary,
                '--tertiary': theme.tertiary,
            }}
        >
            <div className="projects--header">
                <h1 style={{ color: theme.primary }}>Projects</h1>
                <p className="projects--hint" style={{ color: theme.tertiary }}>
                    Hover or tap a project to open it.
                </p>
            </div>

            <div className="projects--body">
                <div className="proj-showcase">
                    {featured.map((project, i) => {
                        const isActive = i === activeIndex;
                        const tags = getTags(project.tags);

                        return (
                            <div
                                key={project.id}
                                className={'proj-panel' + (isActive ? ' is-active' : '')}
                                role="button"
                                tabIndex={0}
                                aria-expanded={isActive}
                                aria-label={project.projectName}
                                onClick={() => setActiveIndex(i)}
                                onMouseEnter={() => setActiveIndex(i)}
                                onFocus={() => setActiveIndex(i)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                            >
                                {project.image && (
                                    <img
                                        className="proj-img"
                                        src={project.image}
                                        alt=""
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="proj-shade" />

                                {/* Shown when collapsed */}
                                <span className="proj-vert-title">
                                    {project.projectName}
                                </span>

                                {/* Shown when open */}
                                <div className="proj-content" aria-hidden={!isActive}>
                                    <h2>{project.projectName}</h2>
                                    <p className="proj-desc">{project.projectDesc}</p>

                                    {tags.length > 0 && (
                                        <ul className="proj-tags">
                                            {tags.map((tag) => (
                                                <li key={tag}>{tag}</li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="proj-links">
                                        {project.demo && (
                                            <a
                                                className="proj-link proj-link--main"
                                                href={project.demo}
                                                target="_blank"
                                                rel="noreferrer"
                                                tabIndex={isActive ? 0 : -1}
                                            >
                                                Live demo
                                            </a>
                                        )}
                                        {project.code && (
                                            <a
                                                className="proj-link"
                                                href={project.code}
                                                target="_blank"
                                                rel="noreferrer"
                                                tabIndex={isActive ? 0 : -1}
                                            >
                                                Source code
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {projectsData.length > FEATURED_COUNT && (
                    <div className="projects--viewAll">
                        <Link to="/projects">
                            <button type="button">
                                View All
                                <HiArrowRight className="projects--viewArr" />
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Projects;