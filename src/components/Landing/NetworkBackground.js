import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HOP_DELAY = 0.32; // seconds a ping takes to cross one cable

/**
 * Builds the whole 3D scene inside `mount` and returns a cleanup function.
 * Nodes are small network switches, cables are sagging tubes, and glowing
 * packets travel along every cable.
 */
function createNetwork(mount, host, colors, reduceMotion) {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const empty = { cleanup: () => {}, width, height };
    if (!width || !height) return empty;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
        return empty; // WebGL not available: the page simply shows no background
    }

    const isMobile = window.innerWidth <= 600;
    const cPrimary = new THREE.Color(colors.primary);
    const cSecondary = new THREE.Color(colors.secondary);
    const cTertiary = new THREE.Color(colors.tertiary);
    const cLed = new THREE.Color('#22c55e');
    const cWhite = new THREE.Color('#ffffff');  

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const group = new THREE.Group();
    scene.add(group);

    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 0, 18);
    const halfH = 18 * Math.tan(THREE.MathUtils.degToRad(25));
    const halfW = halfH * aspect;

    /* ---------- NODES ---------- */
    // Node 0 is the hub. It sits exactly behind the profile photo
    // (left edge on desktop, top edge on mobile) so cables seem to come out of it.
    const hubPos = isMobile
        ? new THREE.Vector3(0, halfH * 0.97, 0)
        : new THREE.Vector3(-halfW * 0.97, 0, 0);
    const nodes = [{ pos: hubPos, isHub: true, edges: [], flash: 0, hover: 0 }];

    const targetCount = isMobile ? 12 : 22;
    const minGap = isMobile ? 2.4 : 2.6;
    let attempts = 0;
    let switchNo = 0;
    let routerNo = 0;
    while (nodes.length < targetCount && attempts < 800) {
        attempts += 1;
        const p = new THREE.Vector3(
            (Math.random() * 2 - 1) * halfW * 0.9,
            (Math.random() * 2 - 1) * halfH * 0.82,
            (Math.random() * 2 - 1) * 3
        );
        const farEnough = nodes.every((n) => n.pos.distanceTo(p) > minGap);
        if (farEnough && p.distanceTo(hubPos) > 3.2) {
            const isRouter = nodes.length % 5 === 0;
            if (isRouter) routerNo += 1;
            else switchNo += 1;
            nodes.push({
                pos: p,
                edges: [],
                flash: 0,
                hover: 0,
                phase: Math.random() * Math.PI * 2,
                base: isRouter ? 1.45 : 1,
                name: isRouter
                    ? `RTR-${String(routerNo).padStart(2, '0')}`
                    : `SW-${String(switchNo).padStart(2, '0')}`,
                ip: `192.168.1.${10 + nodes.length}`,
            });
        }
    }

    const bodyGeo = new THREE.BoxGeometry(0.9, 0.34, 0.5);
    const edgesGeo = new THREE.EdgesGeometry(bodyGeo);
    const portGeo = new THREE.BoxGeometry(0.1, 0.08, 0.03);
    const ledGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const pickGeo = new THREE.SphereGeometry(0.85, 8, 8);
    const bodyMat = new THREE.MeshBasicMaterial({
        color: cSecondary.clone().lerp(cTertiary, 0.16),
    });
    const portMat = new THREE.MeshBasicMaterial({ color: cPrimary });
    const pickMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });
    const pickMeshes = [];

    nodes.forEach((n, i) => {
        if (n.isHub) return;
        const g = new THREE.Group();
        g.position.copy(n.pos);
        g.rotation.y = (Math.random() - 0.5) * 0.5;
        g.rotation.x = (Math.random() - 0.5) * 0.25;

        g.add(new THREE.Mesh(bodyGeo, bodyMat));

        n.lineMat = new THREE.LineBasicMaterial({
            color: cPrimary,
            transparent: true,
            opacity: 0.4,
        });
        g.add(new THREE.LineSegments(edgesGeo, n.lineMat));

        for (let k = 0; k < 4; k += 1) {
            const port = new THREE.Mesh(portGeo, portMat);
            port.position.set(-0.3 + k * 0.14, -0.03, 0.255);
            g.add(port);
        }

        n.ledMat = new THREE.MeshBasicMaterial({ color: cLed });
        const led = new THREE.Mesh(ledGeo, n.ledMat);
        led.position.set(0.36, 0.09, 0.26);
        g.add(led);

        const pick = new THREE.Mesh(pickGeo, pickMat);
        pick.userData.index = i;
        g.add(pick);
        pickMeshes.push(pick);

        g.scale.setScalar(n.base);
        n.group = g;
        group.add(g);
    });

    /* ---------- CABLES (edges) ---------- */
    const edges = [];
    const edgeSet = new Set();
    const addEdge = (a, b) => {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (a === b || edgeSet.has(key)) return;
        edgeSet.add(key);
        edges.push({ a, b });
        nodes[a].edges.push(edges.length - 1);
        nodes[b].edges.push(edges.length - 1);
    };

    nodes.forEach((n, i) => {
        nodes
            .map((m, j) => ({ j, d: n.pos.distanceTo(m.pos) }))
            .filter((o) => o.j !== i)
            .sort((x, y) => x.d - y.d)
            .slice(0, i === 0 ? 4 : 2)
            .forEach((o) => addEdge(i, o.j));
    });

    // make sure every node is reachable from the hub
    const reachable = () => {
        const seen = new Set([0]);
        const queue = [0];
        while (queue.length) {
            const c = queue.shift();
            nodes[c].edges.forEach((ei) => {
                const o = edges[ei].a === c ? edges[ei].b : edges[ei].a;
                if (!seen.has(o)) {
                    seen.add(o);
                    queue.push(o);
                }
            });
        }
        return seen;
    };
    const bridgeGap = () => {
        const seen = reachable();
        if (seen.size === nodes.length) return false;
        let best = null;
        seen.forEach((i) => {
            nodes.forEach((m, j) => {
                if (seen.has(j)) return;
                const d = nodes[i].pos.distanceTo(m.pos);
                if (!best || d < best.d) best = { i, j, d };
            });
        });
        addEdge(best.i, best.j);
        return true;
    };
    let more = true;
    while (more) more = bridgeGap();

    const packetGeo = new THREE.SphereGeometry(0.075, 10, 10);
    const haloGeo = new THREE.SphereGeometry(0.17, 10, 10);
    const packetMat = new THREE.MeshBasicMaterial({ color: cPrimary });
    const haloMat = new THREE.MeshBasicMaterial({
        color: cPrimary,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
    });

    const packets = [];
    edges.forEach((e) => {
        const A = nodes[e.a].pos;
        const B = nodes[e.b].pos;
        const dist = A.distanceTo(B);
        const mid = A.clone().add(B).multiplyScalar(0.5);
        mid.y -= 0.4 + dist * 0.14; // cables sag like real LAN cable
        mid.z += (Math.random() - 0.5) * 1.2;

        e.curve = new THREE.QuadraticBezierCurve3(A.clone(), mid, B.clone());
        e.baseOpacity = 0.38;
        e.mat = new THREE.MeshBasicMaterial({
            color: cTertiary,
            transparent: true,
            opacity: e.baseOpacity,
        });
        group.add(new THREE.Mesh(new THREE.TubeGeometry(e.curve, 36, 0.028, 5, false), e.mat));
        e.hl = 0;
        e.pulse = 0;

        const count = Math.random() < 0.4 ? 2 : 1;
        const firstDir = Math.random() < 0.5 ? 1 : -1;
        for (let k = 0; k < count; k += 1) {
            const mesh = new THREE.Mesh(packetGeo, packetMat);
            mesh.add(new THREE.Mesh(haloGeo, haloMat));
            group.add(mesh);
            packets.push({
                edge: e,
                mesh,
                t: Math.random(),
                dir: k === 0 ? firstDir : -firstDir,
                speed: 0.16 + Math.random() * 0.2,
            });
        }
    });

    /* ---------- PING (click) ---------- */
    const pingGeo = new THREE.SphereGeometry(0.13, 12, 12);
    const pingHaloGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const pingMat = new THREE.MeshBasicMaterial({ color: cPrimary });
    const pingHaloMat = new THREE.MeshBasicMaterial({
        color: cPrimary,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
    });
    const pingPackets = [];
    const scheduled = [];
    let time = 0;

    const flash = (i, v) => {
        if (nodes[i] && !nodes[i].isHub) nodes[i].flash = Math.max(nodes[i].flash, v);
    };

    const launchPing = (edge, dir) => {
        const mesh = new THREE.Mesh(pingGeo, pingMat);
        mesh.add(new THREE.Mesh(pingHaloGeo, pingHaloMat));
        group.add(mesh);
        edge.pulse = 1;
        pingPackets.push({ edge, dir, mesh, t0: time, dur: HOP_DELAY * 0.95 });
    };

    const ping = (origin) => {
        const hops = new Array(nodes.length).fill(-1);
        hops[origin] = 0;
        const queue = [origin];
        while (queue.length) {
            const c = queue.shift();
            nodes[c].edges.forEach((ei) => {
                const o = edges[ei].a === c ? edges[ei].b : edges[ei].a;
                if (hops[o] === -1) {
                    hops[o] = hops[c] + 1;
                    queue.push(o);
                }
            });
        }
        flash(origin, 1);
        edges.forEach((e) => {
            const ha = hops[e.a];
            const hb = hops[e.b];
            if (ha === -1 || ha === hb) return;
            const dir = ha < hb ? 1 : -1;
            scheduled.push({
                at: time + Math.min(ha, hb) * HOP_DELAY,
                run: () => launchPing(e, dir),
            });
        });
    };

    /* ---------- TOOLTIP ---------- */
    const tip = document.createElement('div');
    tip.className = 'net-tooltip';
    host.appendChild(tip);

    /* ---------- POINTER ---------- */
    const mouse = new THREE.Vector2(9, 9);
    const raycaster = new THREE.Raycaster();
    let pointerInside = false;
    let targetRotX = 0;
    let targetRotY = 0;
    let hovered = -1;

    const onMove = (e) => {
        const rect = mount.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        pointerInside = nx >= -1 && nx <= 1 && ny >= -1 && ny <= 1;
        mouse.set(nx, ny);
        if (!reduceMotion) {
            targetRotY = ((e.clientX / window.innerWidth) * 2 - 1) * 0.3;
            targetRotX = -((e.clientY / window.innerHeight) * 2 - 1) * 0.18;
        }
    };
    const onLeave = () => {
        pointerInside = false;
        targetRotX = 0;
        targetRotY = 0;
    };
    const pick = () => {
        if (!pointerInside) return -1;
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.intersectObjects(pickMeshes, false)[0];
        return hit ? hit.object.userData.index : -1;
    };
    const onClick = (e) => {
        onMove(e);
        const idx = pick();
        if (idx >= 0) ping(idx);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    mount.addEventListener('click', onClick);

    /* ---------- LOOP ---------- */
    const tmp = new THREE.Vector3();
    let nextAuto = reduceMotion ? Infinity : 1.0; // intro ping from the photo
    let visible = true;
    let raf = 0;
    let last = performance.now();

    const io = new IntersectionObserver(
        (entries) => {
            visible = entries[0].isIntersecting;
        },
        { threshold: 0 }
    );
    io.observe(mount);

    const update = (dt) => {
        // auto ping so the page feels alive
        if (time >= nextAuto) {
            ping(0);
            nextAuto = time + 7 + Math.random() * 4;
        }
        for (let i = scheduled.length - 1; i >= 0; i -= 1) {
            if (time >= scheduled[i].at) {
                scheduled[i].run();
                scheduled.splice(i, 1);
            }
        }

        // parallax follows the mouse
        const idle = reduceMotion ? 0 : Math.sin(time * 0.25) * 0.05;
        const k = Math.min(1, dt * 3);
        group.rotation.y += (targetRotY + idle - group.rotation.y) * k;
        group.rotation.x += (targetRotX - group.rotation.x) * k;

        // hover
        const newHover = pick();
        if (newHover !== hovered) {
            hovered = newHover;
            mount.style.cursor = hovered >= 0 ? 'pointer' : '';
            if (hovered >= 0) {
                const n = nodes[hovered];
                tip.textContent = `${n.name}\n${n.ip}\n${n.edges.length} links up`;
            }
        }

        nodes.forEach((n, i) => {
            if (n.isHub) return;
            n.hover += ((i === hovered ? 1 : 0) - n.hover) * Math.min(1, dt * 10);
            n.flash = Math.max(0, n.flash - dt * 1.8);
            n.group.scale.setScalar(n.base * (1 + 0.3 * n.hover + 0.25 * n.flash));
            n.lineMat.color.copy(cPrimary).lerp(cWhite, Math.min(1, n.flash * 0.8 + n.hover * 0.5));
            n.lineMat.opacity = 0.65 + 0.35 * Math.max(n.hover, n.flash);
            const blink = 0.5 + 0.5 * Math.sin(time * (2 + n.phase) + n.phase * 6);
            n.ledMat.color.copy(cLed).multiplyScalar(0.4 + 0.6 * blink).lerp(cWhite, n.flash * 0.7);
        });

        edges.forEach((e) => {
            const target = hovered >= 0 && (e.a === hovered || e.b === hovered) ? 1 : 0;
            e.hl += (target - e.hl) * Math.min(1, dt * 8);
            e.pulse = Math.max(0, e.pulse - dt * 1.5);
            e.mat.opacity = e.baseOpacity + (0.95 - e.baseOpacity) * Math.max(e.hl, e.pulse);
        });

        // packets flowing along the cables
        const flow = reduceMotion ? 0.25 : 1;
        packets.forEach((p) => {
            p.t += p.dir * p.speed * (1 + p.edge.hl * 1.5) * flow * dt;
            if (p.t > 1) {
                p.t -= 1;
                flash(p.edge.b, 0.45);
            } else if (p.t < 0) {
                p.t += 1;
                flash(p.edge.a, 0.45);
            }
            p.edge.curve.getPoint(p.t, tmp);
            p.mesh.position.copy(tmp);
        });

        // ping packets (from clicks)
        for (let i = pingPackets.length - 1; i >= 0; i -= 1) {
            const pp = pingPackets[i];
            const u = (time - pp.t0) / pp.dur;
            if (u >= 1) {
                group.remove(pp.mesh);
                flash(pp.dir > 0 ? pp.edge.b : pp.edge.a, 1);
                pingPackets.splice(i, 1);
            } else {
                pp.edge.curve.getPoint(pp.dir > 0 ? u : 1 - u, tmp);
                pp.mesh.position.copy(tmp);
            }
        }

        // tooltip follows the hovered node
        if (hovered >= 0) {
            tmp.copy(nodes[hovered].pos);
            group.localToWorld(tmp);
            tmp.project(camera);
            const sx = (tmp.x * 0.5 + 0.5) * width;
            const sy = (-tmp.y * 0.5 + 0.5) * height;
            tip.style.transform = `translate(${sx + 18}px, ${sy - 40}px)`;
            tip.style.opacity = '1';
        } else {
            tip.style.opacity = '0';
        }
    };

    const loop = (nowMs) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min((nowMs - last) / 1000, 0.05);
        last = nowMs;
        if (!visible || document.hidden) return;
        time += dt;
        update(dt);
        renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    /* ---------- CLEANUP ---------- */
    const cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onMove);
        document.documentElement.removeEventListener('mouseleave', onLeave);
        mount.removeEventListener('click', onClick);
        mount.style.cursor = '';
        scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) =>
                    m.dispose()
                );
            }
        });
        [pingGeo, pingHaloGeo, pingMat, pingHaloMat].forEach((o) => o.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        tip.remove();
    };

    return { cleanup, width, height };
}

function NetworkBackground({ primary, secondary, tertiary }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return undefined;

        const host = mount.parentElement;
        const reduceMotion =
            window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const colors = { primary, secondary, tertiary };

        let current = createNetwork(mount, host, colors, reduceMotion);
        let timer;
        let observer;

        // Rebuild the scene when the panel size really changes (e.g. rotating a phone)
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(() => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const w = mount.clientWidth;
                    const h = mount.clientHeight;
                    if (Math.abs(w - current.width) < 8 && Math.abs(h - current.height) < 8) {
                        return;
                    }
                    current.cleanup();
                    current = createNetwork(mount, host, colors, reduceMotion);
                }, 250);
            });
            observer.observe(mount);
        }

        return () => {
            clearTimeout(timer);
            if (observer) observer.disconnect();
            current.cleanup();
        };
    }, [primary, secondary, tertiary]);

    return (
        <div
            className="network-bg"
            style={{ '--primary': primary, '--secondary': secondary, '--tertiary': tertiary }}
        >
            <div ref={mountRef} className="network-mount" aria-hidden="true" />
            <span className="network-hint">Click a node to send a ping</span>
        </div>
    );
}

export default NetworkBackground;