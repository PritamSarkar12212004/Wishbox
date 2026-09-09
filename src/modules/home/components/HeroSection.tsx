import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    X,
} from 'lucide-react'

function AnnouncementBar() {
    const [visible, setVisible] = useState(true)
    if (!visible) return null
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative flex items-center justify-center px-4 py-2.5 text-center"
            style={{
                background: 'linear-gradient(135deg, #C97B5D 0%, #DEA082 50%, #C97B5D 100%)',
            }}
        >
            <p className="text-[13px] font-medium text-[#FAF6F0]" style={{ fontFamily: "'Inter', sans-serif" }}>
                This week: 20% off garlands and streamers, ends Sunday.
            </p>
            <button
                onClick={() => setVisible(false)}
                aria-label="Dismiss announcement"
                className="absolute right-4 rounded-full p-1 text-[#FAF6F0]/80 transition-colors hover:bg-black/10 hover:text-[#FAF6F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF6F0]"
            >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
        </motion.div>
    )
}

function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-[#FAF6F0]">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');
      `}</style>
            <AnnouncementBar />
        </section>
    )
}

export default HeroSection