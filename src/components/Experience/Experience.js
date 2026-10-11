import React, {
    useContext,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { ThemeContext } from '../../contexts/ThemeContext';
import { experienceData } from '../../data/experienceData';

import './Experience.css';

const STEP_MS = 650; // time the packet takes to reach the next hop

// "2021" -> 2021, "Present" -> current year, anything else -> null
const toYear = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (/present|ongoing|current|now/i.test(String(value))) {
        return new Date().getFullYear();
    }
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
};

const isOngoing = (value) => /present|ongoing|current|now/i.test(String(value || ''));

function Experience() {
    const { theme } = useContext(ThemeContext);
    const total = experienceData.length;

    const routeRef = useRef(null);
    const nodeRefs = useRef([]);
    const timers = useRef([]);
    const started = useRef(false);

    const [reached, setReached] = useState(-1); // last hop that is online
    const [packetIndex, setPacketIndex] = useState(-1); // where the packet is now
    const [ys, setYs] = useState([]); // y position of every node
    const [pulse, setPulse] = useState({ index: -1, n: 0 });

    /* Run the packet from the first hop to the last, lighting hops as it passes */
    const run = useCallback(() => {
        timers.current.forEach(clearTimeout);
        timers.current = [];

        const reduce =
            window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
            setReached(total - 1);
            setPacketIndex(total - 1);
            return;
        }

        setReached(-1);
        setPacketIndex(-1);
        for (let i = 0; i < total; i += 1) {
            timers.current.push(
                setTimeout(() => {
                    setReached((r) => Math.max(r, i));
                    setPacketIndex(i);
                }, 350 + i * STEP_MS)
            );
        }
    }, [total]);

    /* Start automatically the first time the route scrolls into view */
    useEffect(() => {
        const el = routeRef.current;
        if (!el || total === 0) return undefined;

        if (typeof IntersectionObserver === 'undefined') {
            started.current = true;
            run();
            return undefined;
        }

        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !started.current) {
                    started.current = true;
                    run();
                }
            },
            { threshold: 0.25 }
        );
        io.observe(el);
        return () => {
            io.disconnect();
            timers.current.forEach(clearTimeout);
        };
    }, [run, total]);

    /* Measure where each node sits so the cable and packet can line up with it */
    const measure = useCallback(() => {
        const route = routeRef.current;
        if (!route) return;
        const top = route.getBoundingClientRect().top;
        setYs(
            nodeRefs.current
                .slice(0, total)
                .map((n) => (n ? n.getBoundingClientRect().top - top + n.offsetHeight / 2 : 0))
        );
    }, [total]);

    useLayoutEffect(() => {
        measure();
    }, [measure]);

    useEffect(() => {
        const route = routeRef.current;
        if (!route) return undefined;
        window.addEventListener('resize', measure);
        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(measure);
            ro.observe(route);
        }
        return () => {
            window.removeEventListener('resize', measure);
            if (ro) ro.disconnect();
        };
    }, [measure]);

    if (total === 0) return null;

    const ready = ys.length === total;
    const firstY = ready ? ys[0] : 0;
    const lastY = ready ? ys[total - 1] : 0;
    const packetY = ready && packetIndex >= 0 ? ys[packetIndex] : firstY;
    const lineHeight = Math.max(lastY - firstY, 0);
    const fillHeight = Math.max(packetY - firstY, 0);

    const sendPacketTo = (i) => {
        setReached((r) => Math.max(r, i));
        setPacketIndex(i);
        setPulse((p) => ({ index: i, n: p.n + 1 }));
    };

    return (
        <div
            className="experience"
            id="experience"
            style={{
                backgroundColor: theme.secondary,
                '--primary': theme.primary,
                '--secondary': theme.secondary,
                '--tertiary': theme.tertiary,
            }}
        >
            <div className="experience-body">
                {theme.expimg && (
                    <div className="experience-image">
                        <img src={theme.expimg} alt="" />
                    </div>
                )}

                <div className="experience-description">
                    <div className="exp-head">
                        <h1 style={{ color: theme.primary }}>Experience</h1>
                        <button type="button" className="exp-replay" onClick={run}>
                            Replay
                        </button>
                    </div>

                    <div className="exp-route" ref={routeRef}>
                        {ready && total > 1 && (
                            <div
                                className="exp-line"
                                style={{ top: firstY, height: lineHeight }}
                            >
                                <div className="exp-line-fill" style={{ height: fillHeight }} />
                            </div>
                        )}

                        {ready && packetIndex >= 0 && (
                            <span className="exp-packet" style={{ top: packetY }} />
                        )}

                        {experienceData.map((exp, i) => {
                            const online = i <= reached;
                            const ongoing = isOngoing(exp.endYear);
                            const start = toYear(exp.startYear);
                            const end = toYear(exp.endYear);
                            let uptime = null;
                            if (start !== null && end !== null) {
                                const d = end - start;
                                uptime = d <= 0 ? 'under 1 yr' : `${d} ${d === 1 ? 'yr' : 'yrs'}`;
                            }

                            const classes =
                                'exp-hop' +
                                (online ? ' is-online' : '') +
                                (ongoing ? ' is-active' : '') +
                                (packetIndex === i ? ' is-current' : '');

                            return (
                                <div
                                    key={exp.id}
                                    className={classes}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${exp.jobtitle} at ${exp.company}`}
                                    onClick={() => sendPacketTo(i)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            sendPacketTo(i);
                                        }
                                    }}
                                >
                                    <span
                                        className="exp-node"
                                        ref={(el) => {
                                            nodeRefs.current[i] = el;
                                        }}
                                    >
                                        <span className="exp-led" />
                                        {pulse.index === i && (
                                            <span key={pulse.n} className="exp-ring" />
                                        )}
                                    </span>

                                    <div className="exp-card">
                                        <div className="exp-card-top">
                                            <span className="exp-hopno">hop {i + 1}</span>
                                            <span className="exp-status">
                                                {ongoing && online
                                                    ? 'active'
                                                    : online
                                                    ? 'completed'
                                                    : 'pending'}
                                            </span>
                                        </div>

                                        <h4>{exp.jobtitle}</h4>
                                        <h5 style={{ color: theme.primary }}>{exp.company}</h5>

                                        <div className="exp-card-bottom">
                                            <span className="exp-years">
                                                {exp.startYear} – {exp.endYear}
                                            </span>
                                            {uptime && (
                                                <span className="exp-uptime">uptime {uptime}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Experience;