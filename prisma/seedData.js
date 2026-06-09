// Seed dataset — mirrors the admin panel's existing mock data
// (rdtherm-admin/src/data/seed.ts) so the database reflects exactly what the
// CMS currently displays. Image URLs here are remote; the seeder downloads them
// into /uploads and rewrites these to local paths.

const GALLERY = [
  { url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80&auto=format&fit=crop", alt: "Industrial pipework", label: "Inside our fabrication bay" },
  { url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1600&q=80&auto=format&fit=crop", alt: "Manufacturing floor", label: "Shop-floor inspection" },
  { url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1600&q=80&auto=format&fit=crop", alt: "Welding operation", label: "Certified welder at work" },
];

const features = [
  { title: "On-Time Delivery, Every Time", body: "Your project schedule is our commitment. We plan, track and deliver — no surprises.", group: "why" },
  { title: "First Time Right Fabrication", body: "QC at every stage means equipment that passes inspection the first time, every time.", group: "why" },
  { title: "Design Optimization", body: "We don't just fabricate — we refine. Our engineers identify improvements before production begins.", group: "why" },
  { title: "Global Code Compliance", body: "ASME, PED, IBR, IS — we fabricate to the codes your markets demand, anywhere in the world.", group: "why" },
  { title: "Single-Source Accountability", body: "One partner for design, engineering, fabrication and delivery. No finger-pointing, just results.", group: "why" },
  { title: "Transparent Communication", body: "Real-time updates, clear documentation and a single point of contact throughout your project.", group: "why" },
];

const testimonials = [
  { author: "Emily Carter", role: "Product Designer", rating: 5, body: "The team's dedication and innovative approach transformed our ideas into reality. Every stage of the project was handled with care and expertise.", avatarUrl: "https://i.pravatar.cc/120?img=47" },
  { author: "Marcus Hale", role: "Process Engineering Lead", rating: 5, body: "From design review to commissioning, R&D Therm felt like an extension of our own engineering team. Documentation and traceability were spotless.", avatarUrl: "https://i.pravatar.cc/120?img=12" },
  { author: "Amara Okafor", role: "Director, Plant Engineering", rating: 5, body: "We needed an ASME U-stamped reactor delivered in 14 weeks. R&D Therm not only met the deadline — they shipped two weeks early.", avatarUrl: "https://i.pravatar.cc/120?img=32" },
  { author: "Sofia Ramirez", role: "Marketing Lead at BrightWave Tech", rating: 5, body: "I was impressed by their professionalism and attention to detail. Communication was clear, and the final product exceeded our expectations.", avatarUrl: "https://i.pravatar.cc/120?img=45" },
  { author: "Kenji Watanabe", role: "Senior Mechanical Engineer", rating: 5, body: "Their welding qualification depth gave us confidence to award the Hastelloy job. Zero NDT rejections across the entire batch.", avatarUrl: "https://i.pravatar.cc/120?img=15" },
  { author: "Priya Iyer", role: "Project Manager — EPC", rating: 4, body: "The team delivered our distillation column with full third-party inspection paperwork on day one. Set-up at site took half the time it normally does.", avatarUrl: "https://i.pravatar.cc/120?img=20" },
];

const logos = [
  ...["KOBE", "On Event", "Oslo", "U-Turn", "Swiss", "Alaska", "Berlin", "Nordic"].map((name) => ({ name, kind: "client", href: "#" })),
  ...["UDHE Jacobs", "ThyssenKrupp", "TCE", "Lloyd's Register", "Bureau Veritas", "TÜV SÜD"].map((name) => ({ name, kind: "integration", href: "#" })),
  ...["ASME U-Stamp", "ASME R-Stamp", "IBR", "PED (CE)", "ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"].map((name) => ({ name, kind: "certification", href: "#" })),
];

const faqs = [
  { question: "What sizes can R&D Therm fabricate?", answer: "We can fabricate equipment up to 4.5 m in shell diameter, 33 m in overall length and 42 MT single-piece weight." },
  { question: "Which codes and certifications do you build to?", answer: "We are ASME U-Stamp certified for pressure vessels, IBR-approved for boilers and steam pressure parts, and routinely build to PED (CE marked) for European exports." },
  { question: "Do you handle exotic-alloy fabrication?", answer: "Yes — titanium, Hastelloy C-22 / C-276, duplex and super-duplex stainless steels, Sanicro 28 and 904L are routine work for our welding division." },
  { question: "What is your typical delivery timeline?", answer: "Standard pressure vessels and heat exchangers typically ship in 12–16 weeks. Larger columns, reactors and skids ship in 16–22 weeks." },
  { question: "Do you provide third-party inspection support?", answer: "Yes — we work routinely with Lloyd's Register, BV, TUV, DNV, SGS and customer-nominated inspection agencies." },
  { question: "Can you offer site erection and commissioning support?", answer: "We routinely send engineers to site for erection supervision, hydro / loop checking and commissioning support." },
];

const blogs = [
  { slug: "breakthroughs-powering-manufacturing-efficiency", title: "Breakthroughs powering manufacturing efficiency", excerpt: "How modern automation, lean process design and digital twin technology are reshaping fabrication shop floors.", category: "Manufacturing", author: "R&D Therm Editorial", date: "2026-05-12", views: 1240, status: "published", cover: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1600&q=80&auto=format&fit=crop", content: "<p>The last decade has reshaped what it means to be efficient on a fabrication shop floor.</p><h2>Lean is finally measurable</h2><p>Modern shop-floor systems track every weld pass, every hold-time, every NDT result.</p>" },
  { slug: "automation-future-of-manufacturing", title: "How automation is shaping the future of manufacturing", excerpt: "Exploring robotic welding cells, AI-driven QC and connected machines across the process equipment industry.", category: "Automation", author: "R&D Therm Editorial", date: "2026-04-28", views: 980, status: "published", cover: "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1600&q=80&auto=format&fit=crop", content: "<p>Automation in process-equipment fabrication isn't about replacing welders.</p><h2>Robotic welding cells</h2><p>We use orbital welders for tube-to-tubesheet joints in heat exchangers.</p>" },
  { slug: "selecting-right-heat-exchanger", title: "Selecting the right heat exchanger for your process", excerpt: "A practical guide to TEMA classes, tube layouts and material selection — written for process engineers.", category: "Engineering", author: "Aarav Mehta", date: "2026-04-14", views: 1530, status: "published", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80&auto=format&fit=crop", content: "<p>Heat exchangers look simple. They're not.</p><h2>Understanding TEMA classes</h2><p>TEMA classes B, C and R each carry a different inspection regime.</p>" },
  { slug: "asme-vs-ped-vs-ibr", title: "ASME vs PED vs IBR: which code does your project need?", excerpt: "Demystifying the three codes that govern most of the world's pressure equipment.", category: "Codes & Standards", author: "Amit Patil", date: "2026-03-30", views: 2110, status: "published", cover: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1600&q=80&auto=format&fit=crop", content: "<p>Most pressure equipment in the world is built to one of three codes.</p><h2>ASME Section VIII</h2><p>Predominantly North American but accepted globally.</p>" },
  { slug: "from-drawing-to-despatch", title: "From drawing to despatch: anatomy of a process skid", excerpt: "A walk through every stage of building a 12-tonne process skid for a multinational pharma client.", category: "Case Study", author: "Devansh Rao", date: "2026-03-18", views: 870, status: "draft", cover: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1600&q=80&auto=format&fit=crop", content: "<p>A 12-tonne process skid looks finished in two photos. The reality is 18 weeks of disciplined work.</p>" },
];

const team = [
  { name: "Nitin Dhage", role: "Managing Director", bio: "Mr. Nitin Dhage holds a degree from NIT Nagpur and brings hands-on industry expertise shaped by his tenure at Thermax, one of India's foremost engineering companies. With a deep understanding of process engineering challenges, he leads R&D Therm with a sharp focus on delivering equipment that performs reliably, meets international standards, and is backed by technical depth that clients in the chemical, pharmaceutical, and oil & gas sectors can depend on.", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80&auto=format&fit=crop", group: "director" },
  { name: "Abhay Phadke", role: "Director — Operations", bio: "Mr. Abhay Phadke serves as Operations Director at R&D Therm, overseeing the end-to-end manufacturing process from production planning and resource allocation to quality control and on-time delivery. His hands-on approach to operations ensures that every piece of equipment leaving the facility meets the exacting standards our clients expect. With a commitment to continuous improvement and process discipline, Mr. Phadke plays a central role in maintaining the operational excellence that defines R&D Therm.", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop", group: "director" },
  { name: "Manas Dhage", role: "Director — Sales", bio: "Mr. Manas Dhage serves as Sales Director at R&D Therm and represents the second generation of the family driving the company forward. He holds an M.Tech in Manufacturing Engineering from BITS Pilani, which brings a combination of technical depth and commercial acumen, enabling him to engage meaningfully with clients on equipment requirements while building long-term partnerships. His energy and customer-first approach are central to R&D Therm's growing presence in both domestic and international markets.", photo: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&q=80&auto=format&fit=crop", group: "director" },
  { name: "Aarav Mehta", role: "Lead Process Engineer", bio: "Owns process design reviews across distillation, reactors and heat exchangers.", photo: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=900&q=85&auto=format&fit=crop", group: "team" },
  { name: "Ishaan Kapoor", role: "Head of Fabrication", bio: "Runs the shop floor — 120 welders, 6 bays and every duplex / super-duplex job that ships from Nashik.", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&q=85&auto=format&fit=crop", group: "team" },
  { name: "Riya Sharma", role: "QA / NDT Lead", bio: "Drives radiography, dye-pen, hydro and code-stamp inspections.", photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=900&q=85&auto=format&fit=crop", group: "team" },
];

const caseStudies = [
  { slug: "48mt-distillation-column", title: "48.5 MT distillation column delivered three weeks early", client: "Specialty Chemicals EPC", industry: "Chemical & Petrochemical", summary: "A 4.5 m × 23 m vacuum distillation column fabricated, tested and dispatched in a single piece with a complete code dossier.", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&q=80&auto=format&fit=crop", metrics: [{ label: "Weight", value: "48.5 MT" }, { label: "Delivery", value: "3 weeks early" }, { label: "Punch-list items", value: "0" }], content: "<p>The client needed a 32 m vacuum column with full third-party inspection paperwork on day one.</p>" },
  { slug: "pharma-process-skid", title: "12-tonne pharma process skid, FAT-passed first time", client: "Multinational Pharma", industry: "Pharmaceutical", summary: "End-to-end design, fabrication and FAT of a GMP-ready process skid in 18 weeks with zero rework.", cover: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1600&q=80&auto=format&fit=crop", metrics: [{ label: "Lead time", value: "18 weeks" }, { label: "Rework", value: "None" }, { label: "FAT", value: "First-time pass" }], content: "<p>From P&IDs to dispatch, every stage was owned by a named engineer.</p>" },
];

const products = [
  { slug: "distillation-columns", title: "Distillation Columns", summary: "High-efficiency fractional distillation and separation of liquid mixtures — built to ASME Sec VIII with our U-Stamp.", specs: ["Shell diameter up to 4,500 mm", "Overall length up to 33,000 mm", "Up to 42 MT in single piece"], applications: ["Chemical processing", "Food & beverage", "Biofuels production", "Solvent recovery"], materials: ["Stainless Steel", "Carbon Steel", "Titanium", "Hastelloy", "Sanicro 28"], compliance: ["ASME Section VIII", "ASME U-Stamp", "PED"], benefits: ["High separation efficiency", "Robust construction for continuous duty", "Customisable trays, packing and internals"], featured: true },
  { slug: "shell-and-tube-heat-exchanger", title: "Shell and Tube Heat Exchangers", summary: "Fixed tube-sheet, U-tube and floating-head exchangers for oil refineries, chemical plants and high-pressure processes.", specs: ["All TEMA classes (B, C, R)", "Up to 5,000 m² surface area", "ASME U-Stamp & IBR certified"], applications: ["Oil refineries", "Chemical processing", "Power generation", "Petrochemicals"], materials: ["Stainless Steel", "Carbon Steel", "Titanium", "Hastelloy"], compliance: ["ASME Section VIII", "ASME U-Stamp", "IBR", "TEMA"], benefits: ["Efficient heat transfer", "Field-proven reliability", "Custom-engineered tube layouts"], featured: true },
  { slug: "pressure-vessel", title: "Pressure Vessels", summary: "Code-compliant coded and non-coded pressure vessels in CS, SS, duplex and exotic alloys — ASME, PED and IBR.", specs: ["Up to 80 mm thick", "Volumes up to 100 m³", "Design pressure up to 100 bar"], applications: ["Oil & gas", "Chemical processing", "Pharmaceutical", "Petrochemicals"], materials: ["SA 516 Gr 70", "SS 304 / 316 / 316L", "Duplex 2205", "Hastelloy"], compliance: ["ASME Section VIII Div 1 & 2", "ASME U-Stamp", "PED (CE marked)", "IBR"], benefits: ["Full code compliance", "Material traceability with MTC", "Single-source fabrication"], featured: true },
  { slug: "reactors", title: "Reactors", summary: "Agitated reactors for chemical, pharmaceutical and specialty processes — SS, exotic alloys and high-performance materials.", specs: ["Volume up to 50 m³", "Pressure up to 22 kg/cm²(g)", "SS, Hastelloy & alloy options"], applications: ["Chemical reactions", "Polymerisation", "Crystallisation", "Pharmaceutical production"], materials: ["SS 304 / 316 / 316L / 904L", "Hastelloy C-22 / C-276", "Titanium"], compliance: ["ASME Section VIII"], benefits: ["Uniform mixing and heat transfer", "High-pressure service", "Sanitary finishes for pharma"], featured: false },
  { slug: "deaerator", title: "Deaerator", summary: "Spray-type and tray-type deaerators that remove dissolved O₂ and CO₂ from boiler feedwater.", specs: ["Capacity 0.5 – 100 m³", "Pressure up to 22 kg/cm²(g)", "ASME Sec VIII Div 1 + IBR 1950"], applications: ["Power plants", "Chemical processing", "Oil & gas refineries"], materials: ["Stainless Steel", "Carbon Steel", "Titanium"], compliance: ["ASME Section VIII Div 1", "IBR 1950"], benefits: ["Corrosion prevention", "Enhanced boiler efficiency", "Customisable storage volume"], featured: false },
  { slug: "air-receiver", title: "Air Receivers", summary: "Robust high-pressure air storage tanks designed to absorb compressor pulsations and stabilise supply.", specs: ["Pressure range 6 – 75 Kgf/cm²", "Volumes 0.25 – 90 m³", "ASME U-Stamp certified"], applications: ["Manufacturing plants", "Automotive", "Pharmaceutical", "HVAC systems"], materials: ["SS 304", "SS 316", "SA 516 Gr B"], compliance: ["ASME Section VIII Div 1", "ASME U-Stamp"], benefits: ["Smooths compressor pulsations", "Reduces power consumption", "Custom nozzle options"], featured: false },
  { slug: "storage-tanks", title: "Storage Tanks", summary: "Atmospheric, vertical and horizontal storage tanks designed to API 650, IS 2062 and ASME.", specs: ["API 650 / IS 2062 / ASME", "Fixed, floating & cone roofs", "Above-ground & underground"], applications: ["Oil & gas", "Chemical industry", "Water treatment", "Petrochemical"], materials: ["Carbon Steel", "Stainless Steel", "Aluminium", "FRP-lined"], compliance: ["API 650", "IS 2062", "ASME Section VIII"], benefits: ["Optimised shell & bottom", "Multiple roof designs", "Pressure-vacuum relief"], featured: false },
];

const industries = [
  { key: "chemical", label: "Chemical & Petrochemical", description: "From handling aggressive solvents to high-pressure reaction systems, chemical plants run complex processes around the clock. We build equipment that fits right into these demanding environments and keeps running without trouble.", cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80&auto=format&fit=crop" },
  { key: "pharma", label: "Pharmaceutical & Biotechnology", description: "In pharma and biotech, every vessel, reactor, and heat exchanger that touches the process must meet strict hygiene and traceability standards. We build clean, compliant equipment that your validation team won't have to worry about.", cover: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80&auto=format&fit=crop" },
  { key: "oil-gas", label: "Oil & Gas", description: "Upstream or downstream, the conditions are tough. High temperatures, high pressures, and hazardous media. Our equipment is designed and fabricated to handle what oil and gas throws at it, safely and reliably.", cover: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=80&auto=format&fit=crop" },
  { key: "food", label: "Food & Beverage", description: "Food-grade processes need more than just the right material. Surface finish, weld quality, and cleanability all matter. We understand these requirements and build accordingly.", cover: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&q=80&auto=format&fit=crop" },
  { key: "power", label: "Power & Utilities", description: "Condensers, feedwater heaters, and pressure vessels are critical to keeping a power plant running. They need to perform continuously without failure. We fabricate to the codes and standards this sector demands.", cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop" },
];

const careers = [
  { title: "Senior Mechanical Design Engineer", department: "Engineering", location: "Nashik, India", type: "Full-time", description: "Lead pressure-vessel and heat-exchanger design to ASME Sec VIII.", status: "published" },
  { title: "QC Inspector — Welding", department: "Quality", location: "Nashik, India", type: "Full-time", description: "ASNT Level II inspection across RT, UT, PT and MT.", status: "published" },
  { title: "TIG / GTAW Welder (Stainless Steel)", department: "Fabrication", location: "Nashik, India", type: "Full-time", description: "Qualified GTAW welding on stainless and exotic alloys.", status: "published" },
  { title: "Project Manager — Process Skids", department: "Projects", location: "Nashik, India", type: "Full-time", description: "Own export skid orders from kick-off to dispatch.", status: "published" },
  { title: "Procurement Executive", department: "Supply Chain", location: "Nashik, India", type: "Full-time", description: "Manage audited material vendors with full MTC traceability.", status: "draft" },
];

const leads = [
  { name: "Daniel Brooks", email: "daniel.brooks@petrochem.com", phone: "+1 713 555 0142", company: "Gulf Petrochem", subject: "ASME U-stamped reactor enquiry", message: "Looking for a 30 m³ Hastelloy reactor, need delivery in 16 weeks.", source: "Contact form", leadStatus: "new", createdAt: "2026-05-28T09:00:00.000Z" },
  { name: "Lena Fischer", email: "l.fischer@chemworks.de", phone: "+49 30 5550 118", company: "ChemWorks GmbH", subject: "Distillation column for European plant", message: "PED CE-marked vacuum column, 3.5 m diameter. Can you quote?", source: "Contact form", leadStatus: "in-progress", createdAt: "2026-05-27T09:00:00.000Z" },
  { name: "Rohit Sharma", email: "rohit@aurochem.in", phone: "+91 98220 11223", company: "Auro Chemicals", subject: "Heat exchanger maintenance", message: "Need a floating-head exchanger replacement bundle.", source: "Product page", leadStatus: "qualified", createdAt: "2026-05-26T09:00:00.000Z" },
  { name: "Sara Mendoza", email: "sara.m@biopharma.ph", phone: "+63 2 5551 8890", company: "BioPharma PH", subject: "Deaerator export", message: "Following up on our deaerator enquiry from last month.", source: "Email", leadStatus: "closed", createdAt: "2026-05-25T09:00:00.000Z" },
  { name: "Tomáš Novák", email: "t.novak@energo.cz", phone: "+420 2 5550 9912", company: "Energo CZ", subject: "Storage tank quotation", message: "API 650 tank, 500 m³, carbon steel. Please share lead time.", source: "Contact form", leadStatus: "new", createdAt: "2026-05-24T09:00:00.000Z" },
];

const settings = {
  name: "R & D Therm (I) Pvt. Ltd.",
  shortName: "R&D Therm",
  parent: "A Konark Global Co.",
  tagline: "Design.Fabricate.Deliver",
  description: "From Feed tank to Reactors to Distillation Column, we design and fabricate code-compliant chemical process equipment for global Chemical, Pharma, Agro and Energy plants.",
  address: "C14/2, NICE Industrial Area, MIDC Satpur, Nashik, 422007, Maharashtra, India",
  phone: "+91 94222 93397",
  email: "sales@rdtherm.com",
  social: [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "Twitter", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
  hours: [
    { label: "Mon to Fri", value: "8:00am - 6:00pm" },
    { label: "Saturday", value: "8:00am - 1:00pm" },
    { label: "Sunday", value: "Closed" },
  ],
};

module.exports = {
  GALLERY,
  features,
  testimonials,
  logos,
  faqs,
  blogs,
  team,
  caseStudies,
  products,
  industries,
  careers,
  leads,
  settings,
};
