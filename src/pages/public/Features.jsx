import { motion } from 'framer-motion';
import {
  HiOutlineLocationMarker, HiOutlineClock, HiOutlineQrcode,
  HiOutlineCreditCard, HiOutlineBell, HiOutlineChartBar,
  HiOutlineDeviceMobile, HiOutlineShieldCheck,
} from 'react-icons/hi';

const featuresList = [
  { icon: HiOutlineLocationMarker, title: 'GPS Location Finder', desc: 'Find the nearest available parking spots using integrated maps.' },
  { icon: HiOutlineClock, title: 'Real-Time Updates', desc: 'Live slot status powered by WebSocket technology. Know instantly when a spot opens up.' },
  { icon: HiOutlineQrcode, title: 'QR Code Entry', desc: 'Generate a unique QR code after booking. Scan at the gate for fast, contactless entry.' },
  { icon: HiOutlineCreditCard, title: 'Digital Payments', desc: 'Pay securely via card, UPI, or wallet. Automatic cost calculation based on duration.' },
  { icon: HiOutlineBell, title: 'Smart Notifications', desc: 'Get alerts for booking confirmation, parking expiry, and payment receipts.' },
  { icon: HiOutlineChartBar, title: 'Admin Analytics', desc: 'Full dashboard with revenue charts, peak hours, occupancy rates, and more.' },
  { icon: HiOutlineDeviceMobile, title: 'Mobile Responsive', desc: 'Works perfectly on any device — phone, tablet, or desktop.' },
  { icon: HiOutlineShieldCheck, title: 'Secure Platform', desc: 'JWT authentication, encrypted passwords, and role-based access control.' },
];

const Features = () => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Powerful <span className="text-primary-600">Features</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need for a modern, intelligent parking experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon size={24} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
