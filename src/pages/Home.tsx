import { motion, type Variants } from "framer-motion";
import {
  FiActivity,
  FiArrowRight,
  FiCamera,
  FiCheckCircle,
  FiCode,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";
import { Link } from "react-router-dom";

// Animation Variants
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.2 },
  },
};

const Home = () => {
  const coreModules = [
    {
      title: "Face Recognition",
      desc: "CNN-based identity verification at entry points to ensure authorized access only.",
      icon: <FiCamera />,
      accent: "border-[#0038A8]",
    },
    {
      title: "QR Integration",
      desc: "One-time, date-locked QR codes generated automatically upon admin approval.",
      icon: <FiCode />,
      accent: "border-[#FFD700]",
    },
    {
      title: "Predictive Analytics",
      desc: "Monitor visitor trends and detect anomalies using integrated IoT CCTV data.",
      icon: <FiActivity />,
      accent: "border-[#0038A8]",
    },
  ];

  const visitorSteps = [
    {
      title: "Verify Email",
      desc: "One-time link verification",
      icon: <FiMail />,
    },
    {
      title: "Book Appointment",
      desc: "Upload ID and Face data",
      icon: <FiCheckCircle />,
    },
    {
      title: "Secure Entry",
      desc: "QR Scan & Face Verification",
      icon: <FiShield />,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#FFD700] selection:text-[#0038A8] overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-100 bg-[#0038A8] text-white shadow-xl shadow-[#0038A8]/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FFD700] rounded-lg flex items-center justify-center text-[#0038A8] shadow-md transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <FiLock className="text-lg md:text-xl stroke-3" />
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">
              Uni<span className="text-[#FFD700]">Ventry</span>
            </h1>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link
              to="/login"
              className="hidden sm:block text-xs md:text-sm font-bold hover:text-[#FFD700] transition-colors uppercase tracking-widest"
            >
              Staff Login
            </Link>
            {/* Mobile-optimized button */}
            <Link
              to="/book-appointment"
              className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-[#FFD700] hover:bg-white text-[#0038A8] text-[10px] md:text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-black/10 active:scale-95 whitespace-nowrap"
            >
              Request Visit
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-linear-to-b from-slate-50 to-white overflow-hidden">
        {/* Background Blobs (Scaled for mobile) */}
        <div className="absolute top-[-10%] right-[-5%] w-75 h-75 md:w-125 md:h-125 bg-[#FFD700]/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-5%] w-62.55 h-62.5 md:w-100 md:h-100 bg-[#0038A8]/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text Content */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="space-y-6 md:space-y-8 text-center lg:text-left order-2 lg:order-1"
            >
              <span className="inline-block px-3 py-1.5 md:px-4 rounded-full bg-[#0038A8] text-[#FFD700] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg">
                Secure IoT Ecosystem
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-[#0038A8] leading-none md:leading-[0.9] tracking-tighter">
                Smart Visitor <br />
                <span className="text-slate-900">Monitoring</span>
              </h1>
              <p className="text-base md:text-xl text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                A centralized Capstone solution utilizing{" "}
                <span className="text-[#0038A8] font-bold">
                  Face Recognition
                </span>{" "}
                and{" "}
                <span className="text-[#0038A8] font-bold">QR Integration</span>{" "}
                for high-security campus monitoring.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/book-appointment"
                  className="group px-8 py-4 md:px-10 md:py-5 bg-[#0038A8] text-white text-sm md:text-base font-black rounded-xl flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-[#0038A8] transition-all shadow-2xl hover:-translate-y-1"
                >
                  START APPOINTMENT{" "}
                  <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Link>
                {/* Mobile only staff link for ease of access */}
                <Link
                  to="/login"
                  className="sm:hidden px-8 py-4 text-[#0038A8] font-bold border-2 border-[#0038A8]/10 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  STAFF LOGIN
                </Link>
              </div>
            </motion.div>

            {/* Image Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative order-1 lg:order-2"
            >
              <div className="absolute -inset-4 bg-linear-to-tr from-[#FFD700] to-[#0038A8] rounded-3xl blur-2xl opacity-20 animate-pulse" />
              <div className="relative border-4 md:border-12border-white bg-white rounded-2xl md:rounded-4xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] overflow-hidden">
                <img
                  src="/login_image.png"
                  alt="IoT Interface"
                  className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MODULES */}
      <section className="py-20 md:py-32 bg-[#0038A8] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-20 space-y-4"
          >
            <h2 className="text-[#FFD700] text-xs md:text-sm font-black uppercase tracking-[0.4em]">
              Core Technology
            </h2>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">
              Advanced Security Modules
            </h3>
            <div className="w-16 md:w-24 h-2 bg-[#FFD700] mx-auto rounded-full" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {coreModules.map((module, i) => (
              <motion.div
                variants={fadeInUp}
                key={i}
                className="group p-8 md:p-10 bg-white/5 border border-white/10 rounded-3xl hover:bg-white hover:text-[#0038A8] transition-all duration-500 hover:-translate-y-4 shadow-xl"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#FFD700] flex items-center justify-center text-[#0038A8] text-2xl md:text-3xl mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-[#FFD700]/20">
                  {module.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 tracking-tight">
                  {module.title}
                </h3>
                <p className="text-blue-100 group-hover:text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                  {module.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: JOURNEY */}
      <section className="py-20 md:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="flex flex-col items-center text-center mb-16 md:mb-24"
          >
            <h2 className="text-[#0038A8] text-xs md:text-sm font-black uppercase tracking-[0.4em] mb-4">
              The Workflow
            </h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              The Visitor Journey
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {visitorSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  transition: { delay: i * 0.2, duration: 0.5 },
                }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { type: "spring", stiffness: 300, delay: 0 },
                }}
                className="relative p-8 md:p-10 bg-slate-50 rounded-3xl border-b-8 border-[#FFD700] shadow-sm hover:shadow-2xl transition-shadow cursor-default group"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-5 md:-top-6 left-8 md:left-10 w-10 h-10 md:w-12 md:h-12 bg-[#0038A8] text-[#FFD700] flex items-center justify-center rounded-xl font-black text-lg md:text-xl shadow-lg">
                  0{i + 1}
                </div>

                {/* Icon */}
                <div className="text-3xl md:text-4xl text-[#0038A8] mb-4 md:mb-6 mt-2 md:mt-4 group-hover:scale-100 transition-transform duration-300">
                  {step.icon}
                </div>

                <h4 className="text-xl md:text-2xl font-black text-[#0038A8] mb-3 md:mb-4">
                  {step.title}
                </h4>
                <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#002b82] text-white pt-16 md:pt-24 pb-8 md:pb-12 border-t-8 border-[#FFD700]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-12 md:mb-20 text-center md:text-left">
            {/* Branding Column */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <h1 className="text-3xl md:text-4xl font-black text-white">
                UNI<span className="text-[#FFD700]">VENTRY</span>
              </h1>
              <p className="text-blue-100 text-base md:text-lg leading-relaxed mx-auto md:mx-0 max-w-sm">
                IoT-Based Smart Visitor Management and Monitoring System for
                Rizal Technological University.
              </p>
            </div>

            {/* Navigation Column */}
            <div className="space-y-4 md:space-y-6">
              <h5 className="text-[#FFD700] font-black uppercase tracking-widest text-sm">
                Navigation
              </h5>
              <ul className="space-y-3 md:space-y-4 font-bold text-blue-100 text-sm md:text-base">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-[#FFD700] transition-colors"
                  >
                    Staff Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Standards Column */}
            <div className="space-y-4 md:space-y-6">
              <h5 className="text-[#FFD700] font-black uppercase tracking-widest text-sm">
                Standards
              </h5>
              <ul className="space-y-3 md:space-y-4 font-bold text-blue-100 text-sm md:text-base">
                <li>ISO 25010 Quality</li>
                <li>RTU Pasig / Mandaluyong</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 md:pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-blue-200/60 text-center">
            <p>© {new Date().getFullYear()} UniVentry Capstone Project</p>
            <p>Department of Computer Studies</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
