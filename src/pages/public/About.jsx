import { motion } from 'framer-motion';
import { HiOutlineLightBulb, HiOutlineGlobe, HiOutlineUsers, HiOutlineShieldCheck } from 'react-icons/hi';

const values = [
  { icon: HiOutlineLightBulb, title: 'Innovation', desc: 'We use AI and IoT to bring intelligent parking solutions.' },
  { icon: HiOutlineGlobe, title: 'Sustainability', desc: 'Reducing carbon footprint by eliminating unnecessary driving.' },
  { icon: HiOutlineUsers, title: 'Community', desc: 'Building better cities with smarter infrastructure.' },
  { icon: HiOutlineShieldCheck, title: 'Security', desc: 'Enterprise-grade security for your data and transactions.' },
];

const About = () => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            About <span className="text-primary-600">SmartPark</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            SmartPark is an intelligent parking management platform designed for smart cities.
            We help drivers find, book, and pay for parking seamlessly — while providing
            administrators with powerful tools to manage and optimize parking resources.
          </p>
        </motion.div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              We're on a mission to eliminate the stress of finding parking. Urban drivers
              spend an average of 17 hours per year searching for parking spots. SmartPark
              uses real-time data, AI recommendations, and digital booking to make parking
              effortless.
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
              Our platform integrates with smart city infrastructure to provide live
              occupancy data, predictive analytics, and seamless payment experiences.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-12 flex items-center justify-center"
          >
            <span className="text-8xl">🚗</span>
          </motion.div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card text-center hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <v.icon size={28} className="text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Built with Purpose</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            SmartPark is built by a team of engineers and urban planners passionate about
            making cities more livable. We believe technology should simplify life, not complicate it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
