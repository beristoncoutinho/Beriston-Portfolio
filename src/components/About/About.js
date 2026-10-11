import React, { useContext, useState } from 'react';

import './About.css';
import { ThemeContext } from '../../contexts/ThemeContext';
import { aboutData } from '../../data/aboutData';

const ROLE = 'Network & System Engineer';

const technologies = [
    'Networking',
    'Routing & Switching',
    'VLANs',
    'TCP/IP',
    'Firewalls',
    'Windows Server',
    'Active Directory',
    'Virtualization',
    'NAS & Backup',
    'Troubleshooting',
];

// Your profile, laid out like the layers of a captured packet
const layers = [
    {
        id: 'frame',
        title: 'Frame 1: profile',
        fields: [
            { k: 'role', v: ROLE },
            { k: 'status', v: 'Systems operational. Ready to troubleshoot.' },
        ],
    },
    {
        id: 'eth',
        title: 'Ethernet II: expertise',
        fields: [
            'Network Infrastructure',
            'System Administration',
            'IT Support & Troubleshooting',
            'Network Security Fundamentals',
        ].map((v, i) => ({ k: `area_${i + 1}`, v })),
    },
    {
        id: 'ip',
        title: 'Internet Protocol: technologies',
        fields: technologies.map((v, i) => ({ k: `tech_${i + 1}`, v })),
    },
];

const MAX_BYTES = 48;

const toBytes = (text) =>
    Array.from(text.slice(0, MAX_BYTES)).map((ch) => {
        const c = ch.charCodeAt(0);
        return c < 128 ? c : 63; // non-ASCII shows as "?"
    });

const asciiOf = (bytes) =>
    bytes.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');

function About() {
    const { theme } = useContext(ThemeContext);

    const [open, setOpen] = useState({ frame: true, eth: true, ip: false });
    const [selected, setSelected] = useState('frame:0');
    const [query, setQuery] = useState('');

    const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

    // Find the selected field (for the hex view and the packet list)
    const [selLayerId, selIndex] = selected.split(':');
    const selLayer = layers.find((l) => l.id === selLayerId) || layers[0];
    const selField = selLayer.fields[Number(selIndex)] || layers[0].fields[0];

    const bytes = toBytes(selField.v);
    const rows = [];
    for (let i = 0; i < bytes.length; i += 16) {
        rows.push({ offset: i.toString(16).padStart(4, '0'), bytes: bytes.slice(i, i + 16) });
    }
    const hiddenBytes = Math.max(selField.v.length - MAX_BYTES, 0);

    // Display filter, like the filter bar in a packet analyser
    const q = query.trim().toLowerCase();
    const visibleLayers = layers
        .map((layer) => {
            const layerHit = q && layer.title.toLowerCase().includes(q);
            const fields = layer.fields
                .map((f, index) => ({ ...f, index }))
                .filter(
                    (f) =>
                        !q ||
                        layerHit ||
                        f.k.toLowerCase().includes(q) ||
                        f.v.toLowerCase().includes(q)
                );
            return { ...layer, fields };
        })
        .filter((layer) => !q || layer.fields.length > 0);

    return (
        <section
            className="about"
            id="about"
            style={{
                backgroundColor: theme.secondary,
                '--primary': theme.primary,
                '--secondary': theme.secondary,
                '--tertiary': theme.tertiary,
            }}
        >
            <div className="about-body">
                {/* LEFT: who I am */}
                <div className="about-description">
                    <span className="about-label">
                        <span className="about-dot" />
                        ABOUT ME // SYSTEM PROFILE
                    </span>

                    <h2 style={{ color: theme.primary }}>
                        {aboutData.title || 'Building Connections. Solving Problems.'}
                    </h2>

                    <p>{aboutData.description1}</p>
                    <p>{aboutData.description2}</p>
                </div>

                {/* RIGHT: packet inspector */}
                <div className="insp">
                    <div className="insp-toolbar">
                        <span className="insp-live">
                            <span className="about-dot" />
                            capturing on eth0
                        </span>
                        <label className="insp-filter">
                            <span className="insp-filter-icon">&gt;</span>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Apply a display filter, e.g. vlan"
                                aria-label="Filter profile fields"
                                spellCheck={false}
                            />
                        </label>
                    </div>

                    {/* Packet list: one row, it follows the field you pick below */}
                    <div className="insp-list">
                        <div className="insp-list-row insp-list-head">
                            <span>No.</span>
                            <span>Source</span>
                            <span>Destination</span>
                            <span>Info</span>
                        </div>
                        <div className="insp-list-row insp-list-active">
                            <span>1</span>
                            <span>engineer</span>
                            <span>visitor</span>
                            <span className="insp-info">
                                {selField.k} = {selField.v}
                            </span>
                        </div>
                    </div>

                    {/* Packet details: expandable layers */}
                    <div className="insp-tree" role="tree">
                        {visibleLayers.length === 0 && (
                            <p className="insp-empty">No fields match this filter.</p>
                        )}

                        {visibleLayers.map((layer) => {
                            const isOpen = q ? true : open[layer.id];
                            return (
                                <div key={layer.id} className="tree-layer">
                                    <button
                                        type="button"
                                        className="tree-layer-btn"
                                        aria-expanded={isOpen}
                                        onClick={() => toggle(layer.id)}
                                    >
                                        <span className={'tree-arrow' + (isOpen ? ' is-open' : '')}>
                                            &#9656;
                                        </span>
                                        {layer.title}
                                    </button>

                                    {isOpen &&
                                        layer.fields.map((f) => {
                                            const key = `${layer.id}:${f.index}`;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    className={
                                                        'tree-field' +
                                                        (selected === key ? ' is-selected' : '')
                                                    }
                                                    aria-pressed={selected === key}
                                                    onClick={() => setSelected(key)}
                                                >
                                                    <span className="tree-key">{f.k}:</span>{' '}
                                                    <span className="tree-val">{f.v}</span>
                                                </button>
                                            );
                                        })}
                                </div>
                            );
                        })}
                    </div>

                    {/* Packet bytes: the selected field as hex */}
                    <div className="insp-hex" aria-label="Packet bytes">
                        {rows.map((row) => (
                            <div className="hex-row" key={row.offset}>
                                <span className="hex-offset">{row.offset}</span>
                                <span className="hex-bytes">
                                    {Array.from({ length: 16 }).map((_, j) => (
                                        <span
                                            key={j}
                                            className={'hex-byte' + (j === 7 ? ' has-gap' : '')}
                                        >
                                            {row.bytes[j] !== undefined
                                                ? row.bytes[j].toString(16).padStart(2, '0')
                                                : ''}
                                        </span>
                                    ))}
                                </span>
                                <span className="hex-ascii">{asciiOf(row.bytes)}</span>
                            </div>
                        ))}
                        {hiddenBytes > 0 && (
                            <div className="hex-more">+ {hiddenBytes} more bytes</div>
                        )}
                    </div>

                    <div className="insp-status">
                        <span>
                            {selLayer.title.split(':')[0]} &gt; {selField.k}
                        </span>
                        <span>{selField.v.length} bytes</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default About;