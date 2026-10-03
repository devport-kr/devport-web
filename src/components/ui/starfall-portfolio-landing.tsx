import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import DatabaseWithRestApi from './database-with-rest-api';

// --- TYPE DEFINITIONS FOR PROPS ---
interface Project { title: string; description: string; tags: string[]; imageContent?: React.ReactNode; }

export interface PortfolioPageProps {
    hero?: { titleLine1: React.ReactNode; titleLine2Gradient: React.ReactNode; subtitle: React.ReactNode; subtitleBottom?: React.ReactNode; };
    projects?: Project[];
    showAnimatedBackground?: boolean;
}

// --- INTERNAL ANIMATED BACKGROUND COMPONENT ---
const AuroraBackground: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Optimize renderer: lower power preference, disable antialias
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'low-power',
            alpha: false,
            stencil: false,
            depth: false
        });

        // Lower resolution for performance: max 1.0 pixel ratio, and halved if needed
        const pixelRatio = Math.min(window.devicePixelRatio, 1.0);
        renderer.setPixelRatio(pixelRatio * 0.75);
        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.domElement.style.position = 'fixed';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.left = '0';
        renderer.domElement.style.zIndex = '0';
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.pointerEvents = 'none';
        currentMount.appendChild(renderer.domElement);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float iTime; uniform vec2 iResolution;
                // Reduced octaves for performance
                #define NUM_OCTAVES 2
                float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
                float noise(vec2 p){ vec2 ip=floor(p);vec2 u=fract(p);u=u*u*(3.0-2.0*u);float res=mix(mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);return res*res; }
                float fbm(vec2 x) { float v=0.0;float a=0.3;vec2 shift=vec2(100);mat2 rot=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.50));for(int i=0;i<NUM_OCTAVES;++i){v+=a*noise(x);x=rot*x*2.0+shift;a*=0.4;}return v;}
                void main() {
                    vec2 p=((gl_FragCoord.xy)-iResolution.xy*0.5)/iResolution.y*mat2(6.,-4.,4.,6.);vec4 o=vec4(0.);float f=2.+fbm(p+vec2(iTime*2.,0.))*.5;
                    // Reduced iterations from 18 to 10. Low red keeps streaks in the brand's blue-cyan range.
                    for(float i=0.;i++<10.;){
                        vec2 v=p+cos(i*i+(iTime+p.x*.08)*.025+i*vec2(13.,11.))*3.5;
                        float tailNoise=fbm(v+vec2(iTime*.3,i))*.3*(1.-(i/10.));
                        vec4 auroraColors=vec4(.03+.08*sin(i*.2+iTime*.4),.42+.38*cos(i*.3+iTime*.5),.85+.15*sin(i*.4+iTime*.3),1.1);
                        vec4 currentContribution=auroraColors*exp(sin(i*i+iTime*.8))/length(max(v,vec2(v.x*f*.015,v.y*1.5)));
                        float thinnessFactor=smoothstep(0.,1.,i/10.)*.6;
                        o+=currentContribution*(1.+tailNoise*.8)*thinnessFactor;
                    }
                    o=tanh(pow(o/80.,vec4(1.5)));gl_FragColor=o*1.4;
                }`
        });
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        let animationFrameId: number;
        let lastTime = 0;
        const animate = (time: number) => {
            animationFrameId = requestAnimationFrame(animate);
            // Limit to ~30fps for even more savings
            if (time - lastTime < 32) return;
            lastTime = time;

            material.uniforms.iTime.value = time * 0.0005;
            renderer.render(scene, camera);
        };

        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        animate(0);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            if (currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);

            // Comprehensive Three.js disposal
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                mesh.material.dispose();
            }
            renderer.dispose();
            scene.clear();
        };
    }, []);
    return <div ref={mountRef} />;
};

// --- DEFAULT DATA ---
const defaultData = {
    hero: { titleLine1: 'Creative Developer &', titleLine2Gradient: 'Digital Designer', subtitle: 'I craft beautiful digital experiences through code and design. Specializing in modern web development, UI/UX design, and bringing innovative ideas to life.', subtitleBottom: undefined },
    projects: [
        { title: 'FinTech Mobile App', description: 'React Native app with AI-powered financial insights.', tags: ['React Native', 'Node.js'], imageContent: undefined as React.ReactNode },
        { title: 'Data Visualization Platform', description: 'Interactive dashboard for complex data analysis.', tags: ['D3.js', 'Python'], imageContent: undefined as React.ReactNode },
        { title: '3D Portfolio Site', description: 'Immersive WebGL experience with 3D elements.', tags: ['Three.js', 'WebGL'], imageContent: undefined as React.ReactNode },
    ],
};

// --- MAIN CUSTOMIZABLE PORTFOLIO COMPONENT ---
const PortfolioPage: React.FC<PortfolioPageProps> = ({
    hero = defaultData.hero,
    showAnimatedBackground = true,
}) => {
    return (
        <div className="text-text-primary">
            {showAnimatedBackground && <AuroraBackground />}
            <div className="relative">
                <main id="about" className="w-full flex flex-col items-center justify-center px-6 py-24 lg:py-40">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="mb-24">
                            <p className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 border border-surface-border-strong rounded bg-surface/70 backdrop-blur font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                                <span className="live-dot" aria-hidden="true" />
                                Ports · Open-source hub
                            </p>
                            <h1 className="text-[2.75rem] sm:text-6xl lg:text-7xl leading-[1.1] font-semibold text-text-primary tracking-[-0.03em] mb-8">
                                {hero.titleLine1}
                                <span className="block font-mono text-accent tracking-[-0.04em]">
                                    {hero.titleLine2Gradient}
                                    <span className="text-text-primary">.</span>
                                </span>
                            </h1>
                            <motion.p
                                className="md:text-xl max-w-3xl leading-relaxed text-lg text-text-secondary mx-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                {hero.subtitle}
                            </motion.p>
                        </div>

                        <div className="flex justify-center w-full pb-8">
                            <DatabaseWithRestApi
                                className="w-full max-w-[650px]"
                                title="Port AI agent"
                                circleText="portki"
                                buttonTexts={{
                                    first: "챗봇",
                                    second: "위키",
                                    third: "트렌딩",
                                    fourth: "랭킹"
                                }}
                                badgeTexts={{
                                    first: "Codes",
                                    second: "Docs",
                                    third: "Issues",
                                    fourth: "Releases"
                                }}
                            />
                        </div>
                        {hero.subtitleBottom && (
                            <motion.div
                                className="mt-10 flex flex-col items-center gap-3"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                {/* decorative line */}
                                <div className="flex items-center gap-3 w-full max-w-sm">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-surface-border" />
                                    <motion.span
                                        className="w-1.5 h-1.5 rounded-[1px] bg-accent"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-surface-border" />
                                </div>
                                <p className="md:text-lg max-w-3xl leading-relaxed text-base text-text-muted mx-auto">
                                    {hero.subtitleBottom}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export { PortfolioPage };
