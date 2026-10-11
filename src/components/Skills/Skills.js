import React, { useState, useContext } from 'react';
import './Skills.css';
import { ThemeContext } from '../../contexts/ThemeContext';
import { skillsData } from '../../data/skillsData';

// Icons (Font Awesome 6)
import {
    FaNetworkWired, FaRoute, FaDiagramProject, FaWrench, FaShieldHalved,
    FaSitemap, FaEthernet, FaCalculator, FaServer, FaUserShield,
    FaUserLock, FaWindows, FaDatabase,
    FaChartLine, FaLock, FaMicrochip, FaHeadset,
} from 'react-icons/fa6';
import { SiVmware } from 'react-icons/si';

const iconMap = {
    FaNetworkWired: <FaNetworkWired />,
    FaRoute: <FaRoute />,
    FaDiagramProject: <FaDiagramProject />,
    FaWrench: <FaWrench />,
    FaShieldHalved: <FaShieldHalved />,
    FaSitemap: <FaSitemap />,
    FaEthernet: <FaEthernet />,
    FaCalculator: <FaCalculator />,
    FaServer: <FaServer />,
    FaUserShield: <FaUserShield />,
    FaUserLock: <FaUserLock />,
    FaWindows: <FaWindows />,
    FaDatabase: <FaDatabase />,
    SiVmware: <SiVmware />,
    FaChartLine: <FaChartLine />,
    FaLock: <FaLock />,
    FaMicrochip: <FaMicrochip />,
    FaHeadset: <FaHeadset />,
};

// VLAN ids go 10, 20, 30 ... like a real switch config
const vlanId = (index) => (index + 1) * 10;

function Skills() {
    const { theme } = useContext(ThemeContext);
    const [activeTab, setActiveTab] = useState(0);
    const [selected, setSelected] = useState(-1);

    if (!skillsData || skillsData.length === 0) return null;

    const group = skillsData[activeTab];
    const picked = selected >= 0 ? group.skills[selected] : null;

    const changeTab = (index) => {
        setActiveTab(index);
        setSelected(-1);
    };

    return (
        <section
            id="skills"
            className="skills-section"
            style={{
                backgroundColor: theme.secondary,
                '--primary': theme.primary,
                '--secondary': theme.secondary,
                '--tertiary': theme.tertiary,
            }}
        >
            <div className="skills-inner">
                <div className="skills-header">
                    <h2 style={{ color: theme.primary }}>Technical Skills</h2>
                </div>

                {/* Switch faceplate */}
                <div className="switch">
                    <span className="screw s1" aria-hidden="true" />
                    <span className="screw s2" aria-hidden="true" />
                    <span className="screw s3" aria-hidden="true" />
                    <span className="screw s4" aria-hidden="true" />

                    <div className="switch-bar">
                        <span className="switch-name">skills-sw01</span>
                        <span className="switch-meta">
                            <span className="switch-dot" />
                            {group.skills.length} ports up
                        </span>
                    </div>

                    <div className="switch-body">
                        {/* Categories = VLANs */}
                        <div className="vlan-tabs" role="tablist" aria-label="Skill categories">
                            {skillsData.map((g, i) => (
                                <button
                                    key={g.category}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === i}
                                    className={'vlan-tab' + (activeTab === i ? ' is-active' : '')}
                                    onClick={() => changeTab(i)}
                                >
                                    <span className="vlan-id">vlan {vlanId(i)}</span>
                                    <span className="vlan-name">{g.category}</span>
                                </button>
                            ))}
                        </div>

                        {/* Skills = ports */}
                        <div className="switch-main" role="tabpanel">
                            <div className="port-grid" key={activeTab}>
                                {group.skills.map((skill, i) => (
                                    <button
                                        key={skill.name + i}
                                        type="button"
                                        className={'port' + (selected === i ? ' is-selected' : '')}
                                        style={{ '--i': i }}
                                        aria-pressed={selected === i}
                                        aria-label={skill.name}
                                        onClick={() => setSelected(i)}
                                    >
                                        <span className="port-no">Gi1/0/{i + 1}</span>
                                        <span className="port-act" />
                                        <span className="port-led" />
                                        <span className="port-socket">
                                            {iconMap[skill.icon] || <FaNetworkWired />}
                                        </span>
                                        <span className="port-name">{skill.name}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="port-status" aria-live="polite">
                                {picked ? (
                                    <>
                                        <span className="ps-line">
                                            <span className="ps-if">
                                                GigabitEthernet1/0/{selected + 1}
                                            </span>{' '}
                                            is up, line protocol is up
                                        </span>
                                        <span className="ps-name">{picked.name}</span>
                                    </>
                                ) : (
                                    <span className="ps-line">Select a port to inspect it.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Skills;