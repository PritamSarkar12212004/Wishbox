import { motion } from 'framer-motion'

function AnnouncementBar() {
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