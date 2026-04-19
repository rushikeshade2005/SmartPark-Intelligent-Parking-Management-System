import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineLocationMarker, HiOutlineClock, HiOutlineShieldCheck,
  HiOutlineLightningBolt, HiOutlineDeviceMobile, HiOutlineChartBar,
  HiOutlineChevronDown, HiOutlineSearch, HiOutlineCreditCard,
  HiOutlineUserCircle, HiOutlineCog, HiOutlineQuestionMarkCircle,
  HiOutlineStar,
} from 'react-icons/hi';

const features = [
  { icon: HiOutlineLocationMarker, title: 'Find Nearby Parking', desc: 'Locate the closest available parking spots in real-time with GPS integration.' },
  { icon: HiOutlineClock, title: 'Real-Time Availability', desc: 'See live slot status updates — no guessing, no circling around the block.' },
  { icon: HiOutlineShieldCheck, title: 'Secure Booking', desc: 'Reserve your spot with confidence. QR code entry ensures verified access.' },
  { icon: HiOutlineLightningBolt, title: 'Smart Suggestions', desc: 'AI-powered recommendations pick the best slot based on distance and duration.' },
  { icon: HiOutlineDeviceMobile, title: 'Digital Payments', desc: 'Pay seamlessly with cards, UPI, or digital wallets. No cash needed.' },
  { icon: HiOutlineChartBar, title: 'Usage Analytics', desc: 'Admins get full analytics — revenue, peak hours, occupancy trends.' },
];

const stats = [
  { value: '500+', label: 'Parking Spots' },
  { value: '10K+', label: 'Monthly Bookings' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.8★', label: 'User Rating' },
];

const howItWorks = [
  { step: '01', title: 'Search', desc: 'Find available parking near your destination using GPS or search by location.', emoji: '🔍' },
  { step: '02', title: 'Book', desc: 'Pick your slot, choose date & time, and confirm your reservation instantly.', emoji: '📅' },
  { step: '03', title: 'Park', desc: 'Arrive at the lot and scan your QR code at the gate for contactless entry.', emoji: '🚗' },
  { step: '04', title: 'Pay', desc: 'Pay digitally when done — no cash, no hassle. Get instant receipt via email.', emoji: '✅' },
];

const testimonials = [
  { name: 'Aniketh R.', role: 'Daily Commuter', text: 'SmartPark saved me 20 minutes every morning. I book my office parking the night before and walk straight in!', rating: 5 },
  { name: 'Priya M.', role: 'Weekend Driver', text: 'The nearby parking feature is a lifesaver. Found a spot 2 minutes from the mall during peak hours. Highly recommend!', rating: 5 },
  { name: 'Rahul K.', role: 'EV Owner', text: 'Love that I can filter for EV charging stations. The QR code entry is seamless — feels like the future of parking.', rating: 4 },
  { name: 'Sneha D.', role: 'Business Traveler', text: 'I use SmartPark in every city I travel to. Real-time availability means I never waste time circling blocks anymore.', rating: 5 },
];

const faqCategories = [
  {
    id: 'booking',
    label: 'Booking & Reservations',
    icon: HiOutlineClock,
    items: [
      { q: 'How do I book a parking slot?', a: 'Go to "Find Parking" or "Nearby Parking", select a parking lot, choose an available slot, pick your start and end time, and confirm your booking. You\'ll receive a QR code for entry.' },
      { q: 'Can I book a slot in advance?', a: 'Yes! You can reserve a slot for a future date and time. Simply select your desired date during the booking process. Advance bookings help guarantee availability at busy locations.' },
      { q: 'Can I cancel or modify my booking?', a: 'Yes, you can cancel a booking from the "My Bookings" section in your dashboard before the start time. Cancellations made before the booking start time are eligible for a refund.' },
      { q: 'What happens if I exceed my booked time?', a: 'If you stay beyond your reserved time, additional charges may apply based on the parking lot\'s hourly rate. You\'ll receive a notification before your booking ends as a reminder.' },
      { q: 'Can I extend my booking duration?', a: 'Yes, if the slot is still available after your end time, you can extend your booking directly from the "My Bookings" section before the current session expires.' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Pricing',
    icon: HiOutlineCreditCard,
    items: [
      { q: 'What payment methods are accepted?', a: 'We support digital payments including credit/debit cards, UPI, and digital wallets. Payment is processed securely and the total cost is displayed before confirmation.' },
      { q: 'Is SmartPark free to use?', a: 'Creating an account and browsing parking lots is completely free. You only pay for the parking duration when you make a booking at the lot\'s hourly rate.' },
      { q: 'How is the parking fee calculated?', a: 'Fees are calculated based on the parking lot\'s hourly rate multiplied by your booked duration. The exact total is shown on the booking confirmation page before payment.' },
      { q: 'How do refunds work?', a: 'If you cancel a booking before its start time, a full refund is processed to your original payment method. Refunds typically appear within 3–5 business days depending on your bank.' },
    ],
  },
  {
    id: 'account',
    label: 'Account & Security',
    icon: HiOutlineUserCircle,
    items: [
      { q: 'How do I create an account?', a: 'Click "Get Started Free" or "Register" and fill in your name, email, and password. Your account will be ready to use immediately.' },
      { q: 'I forgot my password. How do I reset it?', a: 'Click "Forgot Password" on the login page, enter your registered email, and you\'ll receive a password reset link. The link expires after 1 hour for security.' },
      { q: 'How do I manage my vehicles?', a: 'Go to the "Vehicles" section in your dashboard to add, edit, or remove vehicles. You can save multiple vehicles and select one when making a booking.' },
      { q: 'Is my personal data secure?', a: 'Absolutely. We use industry-standard encryption (JWT tokens, bcrypt hashing) and secure HTTPS connections. Your payment data is never stored on our servers.' },
    ],
  },
  {
    id: 'features',
    label: 'Features & Technical',
    icon: HiOutlineCog,
    items: [
      { q: 'How does real-time slot tracking work?', a: 'We use WebSocket technology to provide live slot status updates. When someone books or leaves a slot, availability updates instantly on your screen — no refresh needed.' },
      { q: 'What is the QR code for?', a: 'After booking, a unique QR code is generated. Show this at the parking gate for contactless, verified entry and exit — fast, secure, and hassle-free.' },
      { q: 'How do I find parking near my location?', a: 'Click "Near Me" on the Nearby Parking or Book Parking page. The app uses GPS to show the closest available lots sorted by distance with driving time estimates.' },
      { q: 'Can I see reviews for a parking lot?', a: 'Yes! Each parking lot detail page shows user reviews, ratings, and an overall score. You can also leave a review after using a parking lot to help others.' },
      { q: 'Do you support EV charging stations?', a: 'Some parking lots offer EV charging — look for the "EV Charging" badge on the parking lot detail page. You can also filter lots that support EV charging on the search page.' },
    ],
  },
  {
    id: 'support',
    label: 'Help & Support',
    icon: HiOutlineQuestionMarkCircle,
    items: [
      { q: 'How do I contact support?', a: 'Visit our Contact page or email us at support@smartpark.com. You can also send a message through the "Messages" section in your dashboard for tracked support.' },
      { q: 'How do notifications work?', a: 'You\'ll receive real-time notifications for booking confirmations, reminders before your session ends, cancellation updates, and payment receipts — all in the bell icon on the navbar.' },
      { q: 'Can I use SmartPark in multiple cities?', a: 'Yes, SmartPark works across all partnered cities. Use the "Nearby" feature or search for parking lots in any supported location.' },
      { q: 'How do I report an issue with a parking lot?', a: 'You can report issues through the Contact page or directly from the parking lot detail page by leaving a review. Our team reviews all reports within 24 hours.' },
    ],
  },
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState({});
  const [activeCategory, setActiveCategory] = useState('top');
  const [faqSearch, setFaqSearch] = useState('');

  const toggleFaq = (key) => {
    setOpenFaq((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Top 10 most important FAQs (hand-picked across categories)
  const topFaqs = useMemo(() => {
    const picks = [
      { catId: 'booking', idx: 0 },
      { catId: 'booking', idx: 2 },
      { catId: 'payments', idx: 0 },
      { catId: 'payments', idx: 1 },
      { catId: 'account', idx: 0 },
      { catId: 'account', idx: 3 },
      { catId: 'features', idx: 0 },
      { catId: 'features', idx: 1 },
      { catId: 'features', idx: 2 },
      { catId: 'support', idx: 0 },
    ];
    return picks.map(({ catId, idx }) => {
      const cat = faqCategories.find((c) => c.id === catId);
      return { ...cat.items[idx], key: `${catId}-${idx}` };
    });
  }, []);

  const filteredItems = useMemo(() => {
    const search = faqSearch.toLowerCase().trim();
    if (activeCategory === 'top') {
      if (!search) return { mode: 'top', items: topFaqs };
      return { mode: 'top', items: topFaqs.filter((item) =>
        item.q.toLowerCase().includes(search) || item.a.toLowerCase().includes(search)
      )};
    }
    const cat = faqCategories.find((c) => c.id === activeCategory);
    if (!cat) return { mode: 'category', items: [], label: '' };
    let items = cat.items.map((item, i) => ({ ...item, key: `${cat.id}-${i}` }));
    if (search) {
      items = items.filter((item) =>
        item.q.toLowerCase().includes(search) || item.a.toLowerCase().includes(search)
      );
    }
    return { mode: 'category', items, label: cat.label };
  }, [activeCategory, faqSearch, topFaqs]);

  return (
    <div>
      {/* Hero */}
      <section className="gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-extrabold leading-tight"
            >
              Smart Parking for{' '}
              <span className="text-primary-200">Smart Cities</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-primary-100 leading-relaxed max-w-2xl"
            >
              Find, book, and manage parking effortlessly. Real-time slot availability,
              digital payments, and AI-powered recommendations — all in one platform.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/nearby"
                className="bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl"
              >
                Find Nearby Parking
              </Link>
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/dashboard/book');
                  } else {
                    navigate('/login', { state: { from: '/dashboard/book' } });
                  }
                }}
                className="bg-primary-400 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-300 transition-all shadow-lg hover:shadow-xl"
              >
                Book a Slot
              </button>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all"
                >
                  Get Started Free
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-primary-600">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
            >
              Why Choose SmartPark?
            </motion.h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need for a hassle-free parking experience, powered by cutting-edge technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card hover:shadow-xl group"
              >
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <feature.icon size={24} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
            >
              How It <span className="text-primary-600">Works</span>
            </motion.h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Book your parking spot in four simple steps — no paperwork, no waiting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-800 dark:via-primary-600 dark:to-primary-800" />

            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-20 h-20 mx-auto bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-3xl mb-5 relative z-10 border-2 border-primary-100 dark:border-primary-800 shadow-sm">
                  {item.emoji}
                </div>
                <span className="text-xs font-extrabold text-primary-500 uppercase tracking-widest mb-2 block">Step {item.step}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
            >
              What Our Users <span className="text-primary-600">Say</span>
            </motion.h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Trusted by thousands of drivers across the country.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card hover:shadow-xl flex flex-col"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <HiOutlineStar
                      key={s}
                      size={16}
                      className={s < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1 italic">"{t.text}"</p>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white dark:bg-dark-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
            >
              Frequently Asked <span className="text-primary-600">Questions</span>
            </motion.h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Quick answers to the most common questions — or browse by category for more
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto mb-8">
            <HiOutlineSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
            />
            {faqSearch && (
              <button
                onClick={() => setFaqSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs: Top 10 + individual categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => { setActiveCategory('top'); setOpenFaq({}); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === 'top'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border/80'
              }`}
            >
              Top 10
            </button>
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setOpenFaq({}); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border/80'
                }`}
              >
                {cat.label} ({cat.items.length})
              </button>
            ))}
          </div>

          {/* Category label when viewing a specific section */}
          {filteredItems.mode === 'category' && filteredItems.label && !faqSearch && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{filteredItems.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filteredItems.items.length} questions in this category</p>
            </div>
          )}

          {/* FAQ Items */}
          {filteredItems.items.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineQuestionMarkCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No questions match your search. Try different keywords.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.items.map((item, idx) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.03 }}
                  className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(item.key)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white pr-4 text-sm sm:text-base">{item.q}</span>
                    <HiOutlineChevronDown
                      size={20}
                      className={`text-gray-400 shrink-0 transition-transform duration-300 ${openFaq[item.key] ? 'rotate-180 text-primary-500' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq[item.key] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-dark-border pt-3">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {/* Impressive Support CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-8 sm:p-10 text-center"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-primary-300 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Still Have Questions?</h3>
              <p className="text-primary-100 text-sm sm:text-base mb-6 max-w-md mx-auto">
                Our support team is available 24/7 to help you with anything — bookings, payments, or technical issues.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/contact"
                  className="bg-white text-primary-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-50 transition-all shadow-lg text-sm"
                >
                  Contact Support
                </Link>
                <a
                  href="mailto:support@smartpark.com"
                  className="border-2 border-white/30 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  support@smartpark.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
          >
            Ready to Park Smarter?
          </motion.h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">
            Join thousands of users who save time and stress every day.
          </p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/dashboard/book')}
                  className="btn-primary text-lg px-10 py-3.5"
                >
                  Book Parking Now
                </button>
                <Link to="/nearby" className="btn-secondary text-lg px-10 py-3.5">
                  Find Nearby
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-10 py-3.5">
                  Create Free Account
                </Link>
                <Link to="/about" className="btn-secondary text-lg px-10 py-3.5">
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
