/**
 * Editorial content for the About page.
 * Frontend-only; no backend, API or database is involved.
 */

/** Unsplash helper — width/height are requested at 2× for crisp retina rendering. */
const img = (id: string, w = 1200, h = 1500) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Fallback used whenever a remote photo fails to load. */
export const FALLBACK_IMAGE = img('photo-1513364776144-60967b0f800f', 1200, 1500);

export const HERO = {
    eyebrow: 'Handmade in Jaipur · since 2016',
    title: 'Paper that remembers the hands that made it',
    lead:
        'WishBox began on a single wooden table with two people, one deckle and a stubborn belief that handmade paper deserves a place in modern homes.',
    image: img('photo-1513364776144-60967b0f800f', 2000, 1200),
    imageAlt: 'Hands pressing fresh sheets of handmade paper on a wooden deckle',
    facts: [
        { label: 'Studio', value: 'C-Scheme, Jaipur' },
        { label: 'Makers', value: '34 artisans' },
        { label: 'Craft', value: '100% by hand' },
    ],
};

export const STATS = [
    { value: 128000, suffix: '+', label: 'Sheets made by hand' },
    { value: 34, suffix: '', label: 'Artisans in our collective' },
    { value: 19, suffix: '', label: 'Cities we ship to' },
    { value: 10, suffix: ' yrs', label: 'Of slow, small-batch craft' },
];

export const STORY = {
    kicker: 'Our story',
    title: 'It started with a failed batch — and a promise',
    paragraphs: [
        'In 2016 we tried to press our first batch of cotton paper on a borrowed deckle. It came out lumpy, uneven and completely unsellable. We kept it anyway, pinned it to the studio wall, and wrote one line under it: make it by hand, or do not make it at all.',
        'A decade later that promise still decides everything — which fibres we buy, how slowly we dry each sheet, and why we still refuse to move production to a machine that could do it in seconds.',
    ],
    signature: 'Ananya & Dev · founders',
    image: img('photo-1586075010923-2dd4570fb338', 900, 1100),
    imageAlt: 'Stack of premium handmade decorative paper sheets',
    collage: img('photo-1519197924294-4ba991a11128', 700, 700),
    collageAlt: 'Colourful origami paper sheets laid out in a fan',
};

export const VALUES: Array<{
    icon: 'handshake' | 'leaf' | 'scissors' | 'wind';
    title: string;
    body: string;
}> = [
    {
        icon: 'scissors',
        title: 'Made, not manufactured',
        body: 'Every sheet is pulled, pressed and dried by hand. No two are identical — that is the point.',
    },
    {
        icon: 'leaf',
        title: 'Kinder materials',
        body: 'Recycled cotton rag, natural dyes and chemical-free pulp. Offcuts go straight back into the next batch.',
    },
    {
        icon: 'handshake',
        title: 'Fair by default',
        body: 'Artisans are paid per sheet, not per hour, so better craft earns more. Rates are published to the collective.',
    },
    {
        icon: 'wind',
        title: 'Slow on purpose',
        body: 'Sun-drying takes three days and we will not rush it. Slow is what gives the fibre its strength.',
    },
];

export const JOURNEY: Array<{
    year: string;
    title: string;
    body: string;
    image: string;
    imageAlt: string;
}> = [
    {
        year: '2016',
        title: 'One table, one deckle',
        body: 'Two founders, a rented corner of a Jaipur workshop and a first batch we still keep on the wall.',
        image: img('photo-1586075010923-2dd4570fb338', 600, 600),
        imageAlt: 'First handmade sheets drying on a table',
    },
    {
        year: '2018',
        title: 'The collective forms',
        body: 'Six paper-making families from Sanganer join us. We switch to paying per sheet, never per hour.',
        image: img('photo-1517842645767-c639042777db', 600, 600),
        imageAlt: 'Pastel handmade paper sheets stacked together',
    },
    {
        year: '2020',
        title: 'Solar drying sheds',
        body: 'Tired of losing batches to monsoon humidity, we build our first covered solar drying shed.',
        image: img('photo-1563861826100-9cb868fdbe1c', 600, 600),
        imageAlt: 'Wooden studio wall clock above the drying shed',
    },
    {
        year: '2021',
        title: 'WishBox goes online',
        body: 'The shop opens with 14 products. Orders arrive from nine cities in the first month.',
        image: img('photo-1543007630-9710e4a00a20', 600, 600),
        imageAlt: 'Handmade paper gift bags packed ready to send',
    },
    {
        year: '2023',
        title: 'Gifting, at scale',
        body: 'Wedding and event studios start ordering in bulk. The ribbon and foil range is born.',
        image: img('photo-1457365050282-c53d772ef8b2', 600, 600),
        imageAlt: 'Decorative craft ribbon spool on a workbench',
    },
    {
        year: '2025',
        title: 'A studio of our own',
        body: '34 artisans, one rooftop studio in C-Scheme, and a paper guide that explains every GSM we make.',
        image: img('photo-1578749556568-bc2c40e68b61', 600, 600),
        imageAlt: 'Ceramic vases holding dried flowers in the studio',
    },
    {
        year: 'Today',
        title: 'Still pulling sheets by hand',
        body: 'Same table, same promise. Only the number of hands has changed.',
        image: img('photo-1519197924294-4ba991a11128', 600, 600),
        imageAlt: 'Origami sheets fanned out on the studio floor',
    },
];

export const PROCESS: Array<{
    step: string;
    title: string;
    body: string;
    image: string;
    imageAlt: string;
}> = [
    {
        step: '01',
        title: 'Fibre',
        body: 'Cotton rag and mulberry offcuts are sorted by hand, then beaten with water for six hours.',
        image: img('photo-1586075010923-2dd4570fb338', 800, 800),
        imageAlt: 'Raw cotton paper fibre in a bucket',
    },
    {
        step: '02',
        title: 'Pull',
        body: 'A deckle is dipped, lifted flat and shaken once. That single motion decides the whole sheet.',
        image: img('photo-1513364776144-60967b0f800f', 800, 800),
        imageAlt: 'Hands lifting a deckle out of the pulp vat',
    },
    {
        step: '03',
        title: 'Dry',
        body: 'Sheets rest on felt for three days in solar sheds, then flat-press under weight for a day.',
        image: img('photo-1452802447250-470a88ac82bc', 800, 800),
        imageAlt: 'Cardstock sheets flat-pressing under boards',
    },
    {
        step: '04',
        title: 'Check',
        body: 'Every sheet is inspected for tone and strength. Anything uneven becomes a test sheet, never a product.',
        image: img('photo-1517697471339-4aa32003c11a', 800, 800),
        imageAlt: 'Rose gold shimmer sheets being inspected',
    },
];

export const MATERIALS = [
    { title: 'Recycled cotton rag', body: 'Sourced from Jaipur tailors — offcuts that would otherwise be waste.' },
    { title: 'Sun & solar drying', body: 'No gas dryers. Fresh air does the slow work, three days per batch.' },
    { title: 'Plastic-free packing', body: 'Kraft sleeves, paper tape and a hand-stamped seal on every parcel.' },
];

export const TEAM: Array<{
    name: string;
    role: string;
    bio: string;
    image: string;
    initials: string;
}> = [
    {
        name: 'Ananya Sharma',
        role: 'Founder · Design',
        bio: 'Draws every colour range and still pulls sheets on Fridays.',
        image: img('photo-1494790108377-be9c29b29330', 700, 800),
        initials: 'AS',
    },
    {
        name: 'Dev Mehta',
        role: 'Founder · Craft',
        bio: 'Keeps the deckles level and the drying sheds honest.',
        image: img('photo-1500648767791-00dcc994a43e', 700, 800),
        initials: 'DM',
    },
    {
        name: 'Meera Iyer',
        role: 'Artisan Collective Lead',
        bio: 'Runs rate reviews with all 34 makers every quarter.',
        image: img('photo-1534528741775-53994a69daeb', 700, 800),
        initials: 'MI',
    },
    {
        name: 'Kabir Rana',
        role: 'Studio Manager',
        bio: 'Turns pulp shipments into a schedule nobody has to chase.',
        image: img('photo-1507003211169-0a1dd7228f2d', 700, 800),
        initials: 'KR',
    },
    {
        name: 'Riya Sen',
        role: 'Customer Craft',
        bio: 'Answers your messages, often with a paper swatch attached.',
        image: img('photo-1438761681033-6461ffad8d80', 700, 800),
        initials: 'RS',
    },
    {
        name: 'Arjun Nair',
        role: 'Bulk & Events',
        bio: 'Plans wedding-scale orders without ever promising a rush.',
        image: img('photo-1472099645785-5658abf4ff4e', 700, 800),
        initials: 'AN',
    },
];

export const GALLERY: Array<{ src: string; alt: string }> = [
    { src: img('photo-1513364776144-60967b0f800f', 900, 900), alt: 'Hands working over the pulp vat' },
    { src: img('photo-1517842645767-c639042777db', 900, 900), alt: 'Pastel sheets drying in the sun' },
    { src: img('photo-1519197924294-4ba991a11128', 900, 900), alt: 'Origami papers fanned out' },
    { src: img('photo-1543007630-9710e4a00a20', 900, 900), alt: 'Finished gift bags stacked' },
    { src: img('photo-1452802447250-470a88ac82bc', 900, 900), alt: 'Cardstock under weights' },
    { src: img('photo-1607083206968-13611e3d76db', 900, 900), alt: 'Shimmer sheets catching the light' },
];

export const CTA = {
    title: 'Come see how it is made',
    body: 'Studio visits on Saturdays, or message us and we will walk you through the paper you need.',
};
