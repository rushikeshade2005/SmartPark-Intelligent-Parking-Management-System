import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineChevronDown, HiOutlineSearch } from 'react-icons/hi';

const faqData = [
  {
    category: 'Booking & Reservations',
    items: [
      {
        q: 'How do I book a parking slot?',
        a: 'Go to "Find Parking" or "Nearby Parking", select a parking lot, choose an available slot, pick your start and end time, and confirm your booking. You\'ll receive a QR code for entry.',
      },
      {
        q: 'Can I cancel or modify my booking?',
        a: 'Yes, you can cancel a booking from the "My Bookings" section in your dashboard before the start time. Modifications depend on slot availability.',
      },
      {
        q: 'How far in advance can I book?',
        a: 'You can book a slot as soon as it\'s available. We recommend booking at least 30 minutes before you need to park to guarantee your spot.',
      },
      {
        q: 'What happens if I arrive late?',
        a: 'Your booking remains valid for the entire reserved duration. However, if you don\'t check in within a reasonable time after your start time, the slot may be released for others.',
      },
      {
        q: 'Can I extend my parking duration after booking?',
        a: 'Currently, you would need to create a new booking for an extended period. We\'re working on an in-app extension feature.',
      },
    ],
  },
  {
    category: 'Payments & Pricing',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We support digital payments, cards, UPI, and digital wallets. Payment is processed securely through our platform.',
      },
      {
        q: 'How is the parking fee calculated?',
        a: 'The fee is calculated based on the hourly rate of the parking lot multiplied by your booking duration. The total cost is shown before you confirm your booking.',
      },
      {
        q: 'Will I get a receipt?',
        a: 'Yes, after successful payment, you\'ll receive a digital receipt accessible from the "Payments" section in your dashboard.',
      },
      {
        q: 'Is there a refund policy?',
        a: 'Cancellations made before the booking start time are eligible for a refund. Please check the specific parking lot\'s policy for details.',
      },
    ],
  },
  {
    category: 'Account & Security',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Click "Register" on the top navigation bar, fill in your details (name, email, password, phone number), and submit. You\'ll be ready to book instantly.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Click "Forgot Password" on the login page, enter your registered email, and follow the instructions sent to your inbox to reset your password.',
      },
      {
        q: 'Is my personal data secure?',
        a: 'Absolutely. We use JWT authentication, bcrypt password hashing, and HTTPS encryption. Your data is never shared with third parties.',
      },
      {
        q: 'Can I manage multiple vehicles?',
        a: 'Yes! Go to "My Vehicles" in your dashboard to add, edit, or remove your registered vehicles.',
      },
    ],
  },
  {
    category: 'Using the Platform',
    items: [
      {
        q: 'How does real-time slot tracking work?',
        a: 'We use WebSocket technology to provide live slot status updates. When someone books or leaves a slot, the availability updates instantly on your screen.',
      },
      {
        q: 'What is the QR code for?',
        a: 'After booking, a unique QR code is generated. Show this at the parking gate for contactless, verified entry and exit.',
      },
      {
        q: 'How do I find parking near my location?',
        a: 'Click "Near Me" on the Nearby Parking page or the Book Parking page. The app will use your GPS to show the closest available parking lots sorted by distance.',
      },
      {
        q: 'Can I get directions to the parking lot?',
        a: 'Yes! Each parking lot card has a "Directions" button that opens Google Maps with turn-by-turn navigation to the lot.',
      },
      {
        q: 'How do I leave a review?',
        a: 'After completing a booking, go to "My Bookings", find the completed booking, and click the review option. You can rate 1-5 stars and leave a comment.',
      },
    ],
  },
  {
    category: 'General',
    items: [
      {
        q: 'Is SmartPark free to use?',
        a: 'Creating an account and browsing parking lots is completely free. You only pay for the parking duration when you make a booking.',
      },
      {
        q: 'Which cities is SmartPark available in?',
        a: 'SmartPark is expanding rapidly. Check the "Find Parking" page to see all available parking lots in your area.',
      },
      {
        q: 'How do I contact support?',
        a: 'Visit our Contact page or email us directly. You can also send a message through the "Messages" section in your dashboard.',
      },
      {
        q: 'Can parking lot owners register their lots?',
        a: 'Yes! Contact our admin team through the Contact page to register your parking lot on the SmartPark platform.',
      },
    ],
  },
];

const FAQItem = ({ item, isOpen, onToggle }) => (
  <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
    >
      <span className="font-medium text-gray-900 dark:text-white pr-4 text-sm sm:text-base">{item.q}</span>
      <HiOutlineChevronDown
        size={20}
        className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-500' : ''}`}
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {item.a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter FAQs by search query
  const filteredData = faqData
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0)
    .filter((cat) => !activeCategory || cat.category === activeCategory);

  return (
    <div className="py-16 min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Frequently Asked <span className="text-primary-600">Questions</span>
          </h1>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Got questions? We've got answers. Find everything you need to know about SmartPark.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-8">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 text-base py-3"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
              !activeCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {faqData.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
              className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeCategory === cat.category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* FAQ Sections */}
        {filteredData.length > 0 ? (
          filteredData.map((cat) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{cat.category}</h2>
              <div className="space-y-3">
                {cat.items.map((item, idx) => {
                  const key = `${cat.category}-${idx}`;
                  return (
                    <FAQItem
                      key={key}
                      item={item}
                      isOpen={!!openItems[key]}
                      onToggle={() => toggleItem(key)}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg">No questions match your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory(null); }}
              className="text-primary-600 hover:text-primary-700 font-medium mt-2"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Still have questions CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-2xl p-8 text-center border border-primary-100 dark:border-primary-800/30"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Still have questions?</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link
            to="/contact"
            className="btn-primary inline-flex items-center gap-2"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
