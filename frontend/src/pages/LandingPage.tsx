import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Spline from '@splinetool/react-spline';

const CursorTrail = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let points: { x: number; y: number; age: number }[] = [];
        let mouse = { x: -100, y: -100 };
        let smoothMouse = { x: -100, y: -100 };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        };
        window.addEventListener('resize', resize);
        resize();

        let animationFrameId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Smooth interpolation toward actual cursor
            smoothMouse.x += (mouse.x - smoothMouse.x) * 0.25;
            smoothMouse.y += (mouse.y - smoothMouse.y) * 0.25;

            points.push({ x: smoothMouse.x, y: smoothMouse.y, age: 0 });

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                p.age += 1;

                const life = 1 - p.age / 40;
                if (life > 0) {
                    const radius = 2.5 * life;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(200, 200, 200, ${life * 0.35})`;
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = `rgba(200, 200, 200, ${life * 0.15})`;
                    ctx.fill();
                }
            }

            points = points.filter(p => p.age < 40);
            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
};

export default function LandingPage() {
    return (
        <div className="antialiased bg-black text-[#e5e2e1] font-body selection:bg-primary selection:text-on-primary overflow-x-hidden min-h-screen scroll-smooth">
            <CursorTrail />
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-8">
                <div className="max-w-7xl w-full flex items-center justify-between glass-card px-8 py-3 rounded-full border border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                        </div>
                        <span className="font-headline font-bold text-xl tracking-tight text-white">CoreInventory</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10">
                        <a className="text-white/70 hover:text-white transition-all duration-200 text-sm font-medium relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-primary/60 after:transition-all after:duration-200" href="#features">Features</a>
                        <Link className="text-white/70 hover:text-white transition-all duration-200 text-sm font-medium relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-primary/60 after:transition-all after:duration-200" to="/login">Dashboard</Link>
                        <a className="text-white/70 hover:text-white transition-all duration-200 text-sm font-medium relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-primary/60 after:transition-all after:duration-200" href="#pricing">Pricing</a>
                        <a className="text-white/70 hover:text-white transition-all duration-200 text-sm font-medium relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-primary/60 after:transition-all after:duration-200" href="#docs">Docs</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/Demetrius-4209/odoo.git"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-transparent border border-white/20 text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-white/10 hover:border-white/40 hover:-translate-y-[1px] transition-all duration-200 ease-out flex items-center gap-2 cursor-pointer"
                        >
                            GitHub
                        </a>
                        <Link to="/login" className="primary-gradient text-on-primary-fixed px-6 py-2 rounded-md font-bold text-sm hover:brightness-110 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,218,243,0.3)] transition-all duration-200 ease-out shadow-lg shadow-primary-container/20 cursor-pointer">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative pt-24">
                {/* Hero Section */}
                <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden hero-glow bg-black isolate">
                    {/* Cinematic Robot Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00daf3]/15 blur-[120px] rounded-full pointer-events-none z-[-1]"></div>

                    {/* Spline Space */}
                    <div className="absolute inset-x-0 bottom-0 top-32 flex items-center justify-center pointer-events-auto z-0 h-[100vh]">
                        <Spline className="w-full h-full scale-[1.3] md:scale-[1.65] transform transition-transform -translate-x-8 md:-translate-x-16" scene="https://prod.spline.design/YMqOMpULTfQOFhNU/scene.splinecode" />
                    </div>

                    {/* Vignette / Depth Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-5 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_80%,rgba(0,0,0,1)_100%)]"></div>
                    <div className="absolute inset-0 pointer-events-none z-5 backdrop-blur-[6px]" style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 40%, black 80%)', maskImage: 'radial-gradient(ellipse at center, transparent 40%, black 80%)' }}></div>

                    {/* Hero Text Content */}
                    <div className="max-w-6xl w-full text-center z-10 mt-16 relative pointer-events-none drop-shadow-2xl">
                        <h1 className="font-headline font-extrabold tracking-tighter mb-4 uppercase flex flex-col items-center">
                            <span className="text-7xl md:text-[140px] leading-none text-transparent" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.4)' }}>Control</span>
                            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 -mt-2 md:-mt-6">
                                <span className="text-6xl md:text-[120px] leading-none text-[#ff5500] drop-shadow-[0_0_30px_rgba(255,85,0,0.5)]">Your</span>
                                <span className="text-6xl md:text-[120px] leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">Inventory</span>
                            </div>
                            <span className="text-6xl md:text-[140px] leading-none text-transparent -mt-2 md:-mt-6" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.4)' }}>In Real Time</span>
                        </h1>
                        <p className="font-body text-lg md:text-xl text-white/70 max-w-2xl mx-auto mt-12 mb-10 leading-relaxed font-medium tracking-wide">
                            Track products, warehouses, deliveries and stock movements from one powerful dashboard. The Obsidian Lens into your global supply chain.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pointer-events-auto">
                            <Link to="/register" className="bg-[#ff5500] text-white px-10 py-4 rounded-full font-bold text-base hover:shadow-[0_0_30px_rgba(255,85,0,0.4)] hover:brightness-110 hover:scale-[1.04] transition-all duration-200 ease-out cursor-pointer">
                                Start Managing Inventory
                            </Link>
                            <Link to="/login" className="bg-transparent border border-white/20 text-white px-10 py-4 rounded-full font-bold text-base hover:bg-white/10 hover:border-white/40 hover:-translate-y-[1px] transition-all duration-200 ease-out cursor-pointer">
                                View Dashboard
                            </Link>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent"></div>
                </section>

                {/* Features / Ecosystem Infrastructure Section */}
                <section id="features" className="py-32 px-8 relative z-20">
                    <div className="max-w-7xl mx-auto space-y-24">
                        <div className="text-center space-y-4">
                            <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">Ecosystem Infrastructure</h2>
                            <p className="text-on-surface-variant max-w-xl mx-auto">Seamlessly integrate every touchpoint of your supply chain into a single source of truth.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="glass-card p-8 rounded-xl group hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center mb-8 group-hover:bg-primary transition-colors">
                                    <span className="material-symbols-outlined text-primary text-3xl group-hover:text-on-primary" data-icon="inventory">inventory</span>
                                </div>
                                <h3 className="font-headline text-xl font-bold mb-4">Products</h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Manage all products and SKUs in one place. Intelligent categorisation and serial number tracking built-in.</p>
                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Module <span className="material-symbols-outlined text-sm">arrow_outward</span>
                                </div>
                            </div>

                            <div className="glass-card p-8 rounded-xl group hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center mb-8 group-hover:bg-primary transition-colors">
                                    <span className="material-symbols-outlined text-primary text-3xl group-hover:text-on-primary" data-icon="warehouse">warehouse</span>
                                </div>
                                <h3 className="font-headline text-xl font-bold mb-4">Warehouses</h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Track stock across multiple warehouse locations. Optimize picking routes and storage density automatically.</p>
                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Module <span className="material-symbols-outlined text-sm">arrow_outward</span>
                                </div>
                            </div>

                            <div className="glass-card p-8 rounded-xl group hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center mb-8 group-hover:bg-primary transition-colors">
                                    <span className="material-symbols-outlined text-primary text-3xl group-hover:text-on-primary" data-icon="swap_horiz">swap_horiz</span>
                                </div>
                                <h3 className="font-headline text-xl font-bold mb-4">Stock Movements</h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Monitor receipts, deliveries, transfers and adjustments. Full audit trail of every unit moved.</p>
                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Module <span className="material-symbols-outlined text-sm">arrow_outward</span>
                                </div>
                            </div>

                            <div className="glass-card p-8 rounded-xl group hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
                                <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center mb-8 group-hover:bg-primary transition-colors">
                                    <span className="material-symbols-outlined text-primary text-3xl group-hover:text-on-primary" data-icon="monitoring" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                                </div>
                                <h3 className="font-headline text-xl font-bold mb-4">Live Dashboard</h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">View real-time inventory insights. Predictive analytics for demand forecasting and low-stock alerts.</p>
                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Module <span className="material-symbols-outlined text-sm">arrow_outward</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Predictive Intelligence Section */}
                <section className="py-32 px-8">
                    <div className="max-w-7xl mx-auto glass-card rounded-2xl p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="font-headline text-4xl font-bold">Predictive Intelligence</h2>
                                <p className="text-on-surface-variant leading-relaxed">Our Obsidian engine doesn't just track—it anticipates. Using historical data streams, CoreInventory forecasts stockouts before they happen.</p>
                                <ul className="space-y-6">
                                    <li className="flex items-start gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        </div>
                                        <div>
                                            <span className="font-bold block">Smart Reordering</span>
                                            <span className="text-sm text-on-surface-variant">Automated PO generation when stock hits critical thresholds.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        </div>
                                        <div>
                                            <span className="font-bold block">Multi-Node Sync</span>
                                            <span className="text-sm text-on-surface-variant">Real-time synchronization across global warehouse networks.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-2xl relative">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Inventory Flow</span>
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="h-8 bg-surface-container-low rounded-full overflow-hidden w-full">
                                        <div className="h-full bg-primary w-[75%] rounded-full shadow-[0_0_10px_rgba(0,218,243,0.4)]"></div>
                                    </div>
                                    <div className="h-8 bg-surface-container-low rounded-full overflow-hidden w-full">
                                        <div className="h-full bg-primary w-[45%] rounded-full shadow-[0_0_10px_rgba(0,218,243,0.4)]"></div>
                                    </div>
                                    <div className="h-8 bg-surface-container-low rounded-full overflow-hidden w-full">
                                        <div className="h-full bg-primary w-[90%] rounded-full shadow-[0_0_10px_rgba(0,218,243,0.4)]"></div>
                                    </div>
                                </div>
                                <div className="mt-12 pt-8 border-t border-outline-variant/5 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold font-headline">2.4k</div>
                                        <div className="text-[10px] uppercase text-on-surface-variant font-bold">Inbound</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold font-headline text-primary">12.8k</div>
                                        <div className="text-[10px] uppercase text-on-surface-variant font-bold">Total Stock</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold font-headline">1.1k</div>
                                        <div className="text-[10px] uppercase text-on-surface-variant font-bold">Outbound</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview Section */}
                <section className="py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 relative z-10">
                            <h2 className="font-headline text-4xl md:text-5xl font-bold mb-4">Enterprise-Grade Visibility</h2>
                            <p className="text-on-surface-variant max-w-xl mx-auto text-lg">The real-time mission control your operations team has been waiting for.</p>
                        </div>

                        <div className="relative group">
                            {/* Glow Effect behind image */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-container blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 rounded-[2.5rem]"></div>

                            <div className="relative glass-card rounded-[2rem] ghost-border p-2 md:p-4 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-xl">
                                {/* Top "browser" bar */}
                                <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2 bg-white/5 rounded-t-2xl">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-error/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-primary/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#34c759]/80"></div>
                                    </div>
                                </div>

                                {/* Image container */}
                                <div className="rounded-b-[1.5rem] overflow-hidden bg-surface-container-lowest">
                                    <img
                                        src="/dashboard-preview.png"
                                        alt="CoreInventory Dashboard Real-time Overview"
                                        className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="py-32 px-6">
                    <div className="max-w-5xl mx-auto glass-card rounded-[2.5rem] ghost-border p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-container/10 blur-[100px] rounded-full"></div>
                        <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6">Start Managing Inventory Smarter</h2>
                        <p className="text-on-surface-variant text-lg mb-10 max-w-xl mx-auto">Join over 1,200 enterprises streamlining their logistics with CoreInventory today.</p>
                        <Link to="/register" className="primary-gradient text-on-primary px-10 py-5 rounded-2xl font-extrabold text-lg hover:brightness-110 hover:scale-[1.04] hover:shadow-[0_10px_40px_rgba(0,218,243,0.4)] shadow-[0_10px_30px_rgba(0,218,243,0.3)] transition-all duration-200 ease-out cursor-pointer">
                            Create Free Account
                        </Link>
                        <p className="mt-6 text-xs text-on-surface-variant font-medium">No credit card required • 14-day free trial • Cancel anytime</p>
                    </div>
                </section>
                {/* Pricing / Docs Placeholders */}
                <section id="pricing" className="py-32 px-6 bg-surface-container-lowest">
                    <div className="max-w-7xl mx-auto text-center">
                        <h2 className="font-headline text-4xl font-bold mb-6">Pricing Plans</h2>
                        <p className="text-on-surface-variant max-w-xl mx-auto">Flexible plans for teams of all sizes. (Pricing specifics coming soon)</p>
                    </div>
                </section>

                <section id="docs" className="py-32 px-6">
                    <div className="max-w-7xl mx-auto text-center">
                        <h2 className="font-headline text-4xl font-bold mb-6">Documentation Hub</h2>
                        <p className="text-on-surface-variant max-w-xl mx-auto">Read our developer guides and API integration docs. (Documentation coming soon)</p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-10 px-6 border-t border-outline-variant/10 flex flex-col items-center justify-center text-center">
                <div className="flex flex-col gap-2">
                    <p className="text-on-surface-variant text-sm tracking-wide">© 2026 CoreInventory</p>
                    <p className="text-on-surface-variant/70 text-xs tracking-wide font-medium">Built with FastAPI + React</p>
                </div>
            </footer>
        </div>
    );
}