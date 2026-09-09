import Theme from '@/assets/Theme/Theme';
import {
    Mail,
    Phone,
    MapPin,
    Send,
    InspectionPanel,
    X,
    GoalIcon,
    FaceAngry,
} from 'lucide-react';

const MainFooter = () => {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
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
                        Customer Service
                    </h3>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:underline hover:text-primary transition">Help & FAQs</a></li>
                        <li><a href="#" className="hover:underline hover:text-primary transition">Returns & Exchanges</a></li>
                        <li><a href="#" className="hover:underline hover:text-primary transition">Shipping Info</a></li>
                        <li><a href="#" className="hover:underline hover:text-primary transition">Order Tracking</a></li>
                        <li><a href="#" className="hover:underline hover:text-primary transition">Contact Us</a></li>
                    </ul>
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
                        <li><a href="#" className="hover:underline hover:text-primary transition">Our Blog</a></li>
                        <li><a href="#" className="hover:underline hover:text-primary transition">Gift Cards</a></li>
                        <li><a href="#" className="hover:underline hover:text-primary transition">Bulk Orders</a></li>
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
                            href="#"
                            aria-label="Facebook"
                            className="p-2 rounded-full hover:bg-white/50 transition-colors"
                        >
                            <FaceAngry size={20} style={{ color: Theme.colors.primary }} />
                        </a>
                        <a
                            href="#"
                            aria-label="Instagram"
                            className="p-2 rounded-full hover:bg-white/50 transition-colors"
                        >
                            <InspectionPanel size={20} style={{ color: Theme.colors.primary }} />
                        </a>
                        <a
                            href="#"
                            aria-label="Twitter"
                            className="p-2 rounded-full hover:bg-white/50 transition-colors"
                        >
                            <X size={20} style={{ color: Theme.colors.primary }} />
                        </a>
                        <a
                            href="#"
                            aria-label="YouTube"
                            className="p-2 rounded-full hover:bg-white/50 transition-colors"
                        >
                            <GoalIcon size={20} style={{ color: Theme.colors.primary }} />
                        </a>
                    </div>
                    <p className="text-sm mb-2">Subscribe for exclusive offers & updates</p>
                    <div className="flex items-center bg-white rounded-lg overflow-hidden border border-gray-200 focus-within:border-primary transition">
                        <input
                            type="email"
                            placeholder="Your email"
                            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                            style={{ color: Theme.colors.text }}
                        />
                        <button
                            style={{ backgroundColor: Theme.colors.primary, color: Theme.colors.white }}
                            className="px-3 py-2 hover:bg-primaryDark transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
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