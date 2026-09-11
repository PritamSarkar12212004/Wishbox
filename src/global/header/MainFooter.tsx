    import { useState } from 'react';
    import Theme from '@/assets/Theme/Theme';
    import {
        Mail,
        Phone,
        MapPin,
        MessageCircle,
    } from 'lucide-react';
    import { toast } from 'sonner';

    /** Instagram glyph (brand icon is not shipped by lucide). */
    function InstagramIcon({ size = 20, color }: { size?: number; color?: string }) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
        );
    }

    const MainFooter = () => {
        const [whatsapp, setWhatsapp] = useState('');

        function subscribeWhatsApp() {
            const digits = whatsapp.replace(/\D/g, '');
            if (!/^\d{10}$/.test(digits)) {
                toast.error('Enter a valid 10-digit WhatsApp number');
                return;
            }
            toast.success(`Offers & updates will arrive on +91 ${digits} via WhatsApp`);
            setWhatsapp('');
        }

        return (
            <footer
                style={{
                    backgroundColor: Theme.colors.surfaceAlt,
                    borderTop: `1px solid ${Theme.colors.border}`,
                    color: Theme.colors.textLight,
                    fontFamily: Theme.Typography?.fontFamily || 'Inter, sans-serif',
                }}
                className="w-full py-12 px-4 md:px-8 lg:px-12"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div>
                        <h3
                            style={{ color: Theme.colors.text }}
                            className="text-lg font-semibold mb-4"
                        >
                            🏷️ PaperCraft Decor
                        </h3>
                        <p className="text-sm leading-relaxed mb-4">
                            Handmade paper decorations for your home and events.
                            Crafted with love, inspired by nature.
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} style={{ color: Theme.colors.primary }} />
                                <span>123 Craft Lane, Jaipur, India</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} style={{ color: Theme.colors.primary }} />
                                <span>+91 98765 43210</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={16} style={{ color: Theme.colors.primary }} />
                                <span>hello@papercraft.in</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3
                            style={{ color: Theme.colors.text }}
                            className="text-lg font-semibold mb-4"
                        >
                            Quick Links
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:underline hover:text-primary transition">About Us</a></li>
                            <li><a href="#" className="hover:underline hover:text-primary transition">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3
                            style={{ color: Theme.colors.text }}
                            className="text-lg font-semibold mb-4"
                        >
                            Stay Connected
                        </h3>
                        <div className="flex gap-3 mb-4">
                            <a
                                href="https://www.instagram.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="p-2 rounded-full transition-colors hover:bg-white/50"
                            >
                                <InstagramIcon size={20} color={Theme.colors.accentDark} />
                            </a>
                            <a
                                href="https://wa.me/919876543210"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="p-2 rounded-full transition-colors hover:bg-white/50"
                            >
                                <MessageCircle size={20} style={{ color: '#25D366' }} />
                            </a>
                            <a
                                href="mailto:hello@papercraft.in"
                                aria-label="Email us"
                                className="p-2 rounded-full transition-colors hover:bg-white/50"
                            >
                                <Mail size={20} style={{ color: Theme.colors.primary }} />
                            </a>
                        </div>
                        <p className="text-sm mb-2">Get exclusive offers & updates on WhatsApp</p>
                        <form
                            className="flex items-center bg-white rounded-lg overflow-hidden border border-gray-200 focus-within:border-primary transition"
                            onSubmit={(e) => {
                                e.preventDefault();
                                subscribeWhatsApp();
                            }}
                        >
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                                placeholder="Your WhatsApp number"
                                aria-label="Your WhatsApp number"
                                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent tabular-nums"
                                style={{ color: Theme.colors.text }}
                            />
                            <button
                                type="submit"
                                aria-label="Subscribe via WhatsApp"
                                style={{ backgroundColor: '#25D366', color: Theme.colors.white }}
                                className="px-3 py-2 transition-colors hover:opacity-90"
                            >
                                <MessageCircle size={18} />
                            </button>
                        </form>
                    </div>
                </div>
                <div className="mt-12 pt-6 border-t border-gray-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted">
                    <p style={{ color: Theme.colors.textMuted }} className="text-center">
                        © 2026 PaperCraft Decor — All rights reserved.
                    </p>
                </div>
            </footer>
        );
    };

    export default MainFooter;