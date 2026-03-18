import { motion, type TargetAndTransition, type Variants } from "framer-motion";
import {
  FiActivity,
  FiArrowRight,
  FiBriefcase,
  FiCamera,
  FiCheckCircle,
  FiChevronRight,
  FiCode,
  FiCpu,
  FiCrosshair,
  FiDatabase,
  FiGlobe,
  FiLock,
  FiMail,
  FiMessageSquare,
  FiShield,
  FiSmartphone,
  FiTruck,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";

// --- STRICT ANIMATION VARIANTS ---
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const rotateAnim: TargetAndTransition = {
  rotate: 360,
  transition: { duration: 20, repeat: Infinity, ease: "linear" },
};

const rotateReverseAnim: TargetAndTransition = {
  rotate: -360,
  transition: { duration: 15, repeat: Infinity, ease: "linear" },
};

const scanLineAnim: TargetAndTransition = {
  top: ["0%", "100%", "0%"],
  transition: { duration: 3, repeat: Infinity, ease: "linear" },
};

const pulseGlow: TargetAndTransition = {
  boxShadow: [
    "0px 0px 0px rgba(255,215,0,0)",
    "0px 0px 40px rgba(255,215,0,0.4)",
    "0px 0px 0px rgba(255,215,0,0)",
  ],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
};

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#FFD700]/30 selection:text-[#0038A8] overflow-x-hidden flex flex-col relative">
      {/* ================= FLOATING DOCK HEADER ================= */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4 pointer-events-none">
        <header className="w-full max-w-5xl bg-white/80 backdrop-blur-2xl border border-slate-200 rounded-full shadow-[0_20px_40px_-15px_rgba(0,56,168,0.1)] px-4 py-3 md:px-6 md:py-4 flex items-center justify-between pointer-events-auto">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#0038A8] rounded-full flex items-center justify-center text-[#FFD700] shadow-[0_0_15px_rgba(0,56,168,0.2)] group-hover:scale-110 transition-transform duration-500">
              <FiLock className="text-xl stroke-3" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-[#0038A8]">
                Uni<span className="text-[#FFD700]">Ventry</span>
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-4 bg-slate-50 p-1.5 rounded-full border border-slate-200">
            <Link
              to="/login"
              className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#0038A8] hover:bg-slate-200/50 transition-all px-4 py-2 md:px-6 md:py-3 rounded-full"
            >
              <FiShield /> PORTAL
            </Link>
            <Link
              to="/book-appointment"
              className="px-4 py-2 md:px-8 md:py-3 rounded-full bg-[#FFD700] hover:bg-yellow-400 text-[#0038A8] text-[10px] md:text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] active:scale-95 flex items-center gap-2"
            >
              Book Appointment <FiArrowRight className="text-sm" />
            </Link>
          </div>
        </header>
      </div>

      {/* ================= HERO SECTION (Light & Clean) ================= */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 bg-slate-50 min-h-[95vh] flex flex-col justify-center items-center overflow-hidden">
        {/* Complex Tech Background */}
        <div className="absolute inset-0 z-0 opacity-40 bg-[linear-gradient(to_right,#0038A80A_1px,transparent_1px),linear-gradient(to_bottom,#0038A80A_1px,transparent_1px)] bg-[size:100px_100px][mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-150 bg-[#0038A8]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-350 w-full mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* LEFT: Massive Typography & CTA */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left pt-10 lg:pt-0"
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-50 border border-blue-100 text-[#0038A8] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Version 1.0 Live
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-[3.5rem] sm:text-6xl md:text-7xl lg:text-[6.5rem] font-black leading-[0.95] tracking-tighter mb-8 text-[#0038A8]"
              >
                THE SMART <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FFD700] to-amber-500">
                  CAMPUS IoT SYSTEM
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-slate-500 text-sm md:text-lg max-w-xl font-medium leading-relaxed mb-10 lg:mb-14"
              >
                A non-conventional, ultra-secure IoT ecosystem utilizing CNN
                Facial Recognition and Dynamic Cryptographic QR passes for Rizal
                Technological University.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
              >
                <Link
                  to="/book-appointment"
                  className="w-full sm:w-auto px-10 py-5 rounded-full bg-[#0038A8] text-[#FFD700] text-xs lg:text-sm font-black tracking-[0.2em] uppercase transition-all shadow-[0_10px_40px_rgba(0,56,168,0.3)] hover:bg-[#002b82] hover:-translate-y-1 flex items-center justify-center gap-3 group border border-blue-600/50"
                >
                  Book Appointment{" "}
                  <FiChevronRight className="text-lg group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <FiDatabase size={24} className="text-emerald-500" /> Secure
                  NoSQL Auth
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT: Pure CSS / Framer Motion Biometric HUD (NO IMAGES) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="lg:col-span-5 relative flex justify-center items-center h-100 lg:h-150 w-full"
            >
              {/* HUD Core */}
              <div className="relative w-75 h-75 lg:w-112.5 lg:h-112.5 flex items-center justify-center">
                <div className="absolute inset-0 bg-white border-2 border-slate-100 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,56,168,0.15)] overflow-hidden flex items-center justify-center z-0">
                  {/* HUD Background Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,56,168,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,56,168,0.05)_1px,transparent_1px)] bg-size-[20px_20px]" />
                </div>

                {/* Outer Ring 1 (Dashed) */}
                <motion.div
                  animate={rotateAnim}
                  className="absolute inset-4 rounded-full border-2 border-dashed border-[#0038A8]/30 z-10 pointer-events-none"
                />

                {/* Outer Ring 2 (Solid with gaps) */}
                <motion.div
                  animate={rotateReverseAnim}
                  className="absolute inset-8 rounded-full border border-[#FFD700]/50 z-10 pointer-events-none"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  }}
                />

                {/* Center Glass Plate */}
                <motion.div
                  animate={pulseGlow}
                  className="absolute inset-16 bg-blue-50/50 backdrop-blur-md rounded-full border border-blue-200 flex flex-col items-center justify-center overflow-hidden z-10"
                >
                  <FiCrosshair className="text-8xl lg:text-9xl text-[#FFD700] opacity-30 absolute" />
                  <FiUser className="text-6xl lg:text-8xl text-[#0038A8] relative z-10" />

                  {/* CSS Scanning Laser */}
                  <motion.div
                    animate={scanLineAnim}
                    className="absolute left-0 right-0 h-0.5 bg-[#FFD700] shadow-[0_0_20px_#FFD700] z-20"
                  />
                </motion.div>

                {/* Floating HUD Tags */}
                <div className="absolute -left-10 top-1/4 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3 z-20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[7px] text-slate-400 uppercase tracking-widest font-black">
                      Vector Status
                    </span>
                    <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">
                      Identity Verified
                    </span>
                  </div>
                </div>

                <div className="absolute -right-6 bottom-1/4 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3 z-20">
                  <FiCode className="text-[#0038A8]" />
                  <div className="flex flex-col">
                    <span className="text-[7px] text-slate-400 uppercase tracking-widest font-black">
                      QR Matrix
                    </span>
                    <span className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">
                      Token Active
                    </span>
                  </div>
                </div>

                {/* Decorative Corner Brackets */}
                <div className="absolute -top-4 -left-4 w-12 h-12 border-t-[3px] border-l-[3px] border-[#0038A8] rounded-tl-2xl z-20" />
                <div className="absolute -top-4 -right-4 w-12 h-12 border-t-[3px] border-r-[3px] border-[#0038A8] rounded-tr-2xl z-20" />
                <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-[3px] border-l-[3px] border-[#0038A8] rounded-bl-2xl z-20" />
                <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-[3px] border-r-[3px] border-[#0038A8] rounded-br-2xl z-20" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= INFINITE MARQUEE RIBBON (Gold) ================= */}
      <div className="bg-[#FFD700] py-4 md:py-5 overflow-hidden flex border-y-4 border-[#0038A8] relative z-20">
        <motion.div
          animate={{ x: [0, -1035] }} // Adjust based on content width
          transition={{ duration: 15, ease: "linear", repeat: Infinity }}
          className="flex w-max gap-12 md:gap-24 px-6 text-[11px] md:text-sm font-black text-[#0038A8] uppercase tracking-[0.3em] whitespace-nowrap items-center"
        >
          <span className="flex items-center gap-3">
            <FiCpu size={18} /> Optical Character Recognition
          </span>
          <span className="flex items-center gap-3">
            <FiCamera size={18} /> face-api.js Biometrics
          </span>
          <span className="flex items-center gap-3">
            <FiDatabase size={18} /> MongoDB Cloud Clusters
          </span>
          <span className="flex items-center gap-3">
            <FiGlobe size={18} /> Node.js WebSockets
          </span>
          {/* Duplicate for seamless loop */}
          <span className="flex items-center gap-3">
            <FiCpu size={18} /> Optical Character Recognition
          </span>
          <span className="flex items-center gap-3">
            <FiCamera size={18} /> face-api.js Biometrics
          </span>
          <span className="flex items-center gap-3">
            <FiDatabase size={18} /> MongoDB Cloud Clusters
          </span>
          <span className="flex items-center gap-3">
            <FiGlobe size={18} /> Node.js WebSockets
          </span>
        </motion.div>
      </div>

      {/* ================= BENTO BOX ARCHITECTURE SECTION ================= */}
      <section className="py-32 lg:py-48 bg-slate-50">
        <div className="max-w-350 mx-auto px-6">
          <div className="mb-20 md:mb-32 max-w-3xl">
            <h2 className="text-[#0038A8] text-xs font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
              <span className="w-12 h-0.5 bg-[#0038A8]" /> Core Infrastructure
            </h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-[#0038A8] leading-[1.1]">
              Uncompromising <br /> Security Modules.
            </h3>
          </div>

          {/* Bento Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 auto-rows-[350px]"
          >
            {/* Box 1 (Large - Col Span 2) */}
            <motion.div
              variants={fadeUp}
              className="md:col-span-2 relative p-10 lg:p-14 bg-[#0038A8] rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden group shadow-2xl shadow-blue-900/20"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-16 h-16 rounded-2xl bg-[#FFD700] flex items-center justify-center text-[#0038A8] text-3xl shadow-lg">
                  <FiCrosshair />
                </div>
                <div>
                  <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-4">
                    Facial Biometrics
                  </h3>
                  <p className="text-blue-200 text-sm lg:text-base font-medium max-w-md leading-relaxed">
                    Utilizes CNN-based identity verification at entry points,
                    converting physical facial structures into secure
                    128-dimensional float arrays for unforgeable identification.
                  </p>
                </div>
              </div>
              {/* Decorative graphic */}
              <div className="absolute -bottom-20 -right-20 text-white/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <FiUser size={400} />
              </div>
            </motion.div>

            {/* Box 2 (Tall/Square) */}
            <motion.div
              variants={fadeUp}
              className="relative p-10 lg:p-14 bg-white rounded-[2.5rem] lg:rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden group hover:border-[#FFD700] transition-colors duration-500"
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-[#0038A8] text-3xl border border-amber-100">
                  <FiSmartphone />
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black text-[#0038A8] tracking-tight mb-4">
                    Dynamic QR
                  </h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    Generates time-locked, encrypted QR passes dispatched via
                    email for seamless validation.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Box 3 (Wide - Col Span 3) */}
            <motion.div
              variants={fadeUp}
              className="md:col-span-3 relative p-10 lg:p-14 bg-white border-2 border-slate-100 rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 group shadow-xl"
            >
              <div className="absolute inset-0 bg-linear-to-r from-blue-50/80 to-transparent opacity-50" />
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0038A8] text-2xl border border-blue-100">
                    <FiDatabase />
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.3em] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                    Live Monitoring
                  </span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-[#0038A8] tracking-tight mb-4">
                  IoT Surveillance Logs
                </h3>
                <p className="text-slate-500 text-sm lg:text-base font-medium leading-relaxed">
                  Tracks campus flow using edge-node CCTV cameras. Triggers
                  automated SMS warnings via iProgSMS API for overstaying
                  visitors, backed by an immutable NoSQL audit trail.
                </p>
              </div>
              {/* Abstract Data Nodes */}
              <div className="relative z-10 hidden lg:flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 animate-[spin_10s_linear_infinite]">
                  <FiActivity size={32} />
                </div>
                <div className="w-32 h-32 rounded-full border-2 border-[#0038A8] flex items-center justify-center text-[#FFD700] shadow-[0_0_30px_rgba(0,56,168,0.2)]">
                  <FiGlobe size={48} />
                </div>
                <div className="w-24 h-24 rounded-full border border-slate-200 flex items-center justify-center text-slate-300 animate-[spin_10s_linear_infinite_reverse]">
                  <FiMessageSquare size={32} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= VERTICAL TIMELINE JOURNEY ================= */}
      <section className="py-32 lg:py-48 bg-white relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-24 md:mb-32">
            <h2 className="text-[#0038A8] text-xs font-black uppercase tracking-[0.4em] mb-4">
              Operation Flow
            </h2>
            <h3 className="text-4xl lg:text-6xl font-black tracking-tight text-[#0038A8]">
              The Visitor Protocol
            </h3>
          </div>

          <div className="relative pl-8 md:pl-0">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-slate-100 -translate-x-1/2 rounded-full" />

            {[
              {
                step: "01",
                title: "Verify Identity",
                desc: "Authenticate via OTP protocol to ensure traceability and log integrity.",
                icon: <FiMail />,
                align: "left",
              },
              {
                step: "02",
                title: "Digital KYC",
                desc: "Submit physical ID and facial biometrics for server-side AI extraction.",
                icon: <FiShield />,
                align: "right",
              },
              {
                step: "03",
                title: "Access Granted",
                desc: "Scan Digital QR Pass at the Security Terminal to initiate tracking.",
                icon: <FiCheckCircle />,
                align: "left",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`relative flex items-center justify-between mb-16 md:mb-24 w-full ${item.align === "left" ? "md:flex-row-reverse" : "md:flex-row"}`}
              >
                {/* Empty Space for alternate side on desktop */}
                <div className="hidden md:block w-5/12" />

                {/* Timeline Node */}
                <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#FFD700] border-4 border-white shadow-xl flex items-center justify-center z-10 text-[#0038A8] font-black text-sm">
                  {item.step}
                </div>

                {/* Content Card */}
                <div className="w-full md:w-5/12 pl-12 md:pl-0">
                  <div className="bg-slate-50 p-8 lg:p-10 rounded-4xl border border-slate-200 shadow-lg hover:shadow-2xl hover:border-[#0038A8]/30 transition-all duration-500 group">
                    <div className="text-4xl text-[#0038A8] mb-6 group-hover:scale-110 transition-transform origin-left">
                      {item.icon}
                    </div>
                    <h4 className="text-2xl font-black text-[#0038A8] tracking-tight mb-3">
                      {item.title}
                    </h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= UNIVERSAL ACCESS (Staggered Cards) ================= */}
      <section className="py-32 lg:py-48 bg-slate-50 border-t-8 border-[#FFD700] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-200 h-200 bg-[#0038A8]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-20 lg:mb-32">
            <h2 className="text-[#0038A8] text-xs font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
              <span className="w-12 h-0.5 bg-[#0038A8]" /> Demographics
            </h2>
            <h3 className="text-4xl lg:text-6xl font-black tracking-tight text-[#0038A8] mb-8">
              Adaptive Access Control.
            </h3>
            <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
              The system dynamically categorizes visitors to enforce tailored
              security protocols based on their institutional relationship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <FiUser />, title: "Students & Alumni", delay: 0 },
              {
                icon: <FiBriefcase />,
                title: "Applicants & Staff",
                delay: 0.1,
              },
              { icon: <FiTruck />, title: "Suppliers & Merchants", delay: 0.2 },
              { icon: <FiUsers />, title: "Parents & Guests", delay: 0.3 },
            ].map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay, duration: 0.6 }}
                key={idx}
                className={`bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 text-center hover:bg-blue-50 hover:border-blue-200 transition-all duration-500 shadow-sm group ${idx % 2 !== 0 ? "lg:translate-y-12" : ""}`}
              >
                <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-8 bg-slate-50 text-[#0038A8] group-hover:bg-[#FFD700] transition-colors duration-500 shadow-sm border border-slate-100 group-hover:border-[#FFD700]">
                  {item.icon}
                </div>
                <h4 className="text-lg font-black text-[#0038A8] tracking-wide">
                  {item.title}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MASSIVE FOOTER ================= */}
      <footer className="bg-[#0038A8] text-white pt-32 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Edge-to-Edge Typography */}
          <div className="text-center mb-24">
            <h1 className="text-[15vw] leading-none font-black text-white/10 tracking-tighter select-none">
              UNIVENTRY
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20 relative z-10 -mt-32">
            {/* Branding Column */}
            <div className="lg:col-span-2 space-y-8 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="w-12 h-12 bg-[#FFD700] rounded-xl flex items-center justify-center text-[#0038A8] shadow-lg">
                  <FiLock className="text-2xl stroke-3" />
                </div>
                <div className="text-3xl font-black tracking-tighter uppercase leading-none text-white">
                  Uni<span className="text-[#FFD700]">Ventry</span>
                </div>
              </div>
              <p className="text-blue-100/80 text-sm lg:text-base leading-relaxed max-w-md mx-auto md:mx-0 font-medium">
                Engineered exclusively for Rizal Technological University.
                Ensuring campus safety through immutable data logs and AI
                surveillance.
              </p>
            </div>

            {/* Navigation Column */}
            <div className="space-y-6 text-center md:text-left">
              <h5 className="text-[#FFD700] font-black uppercase tracking-[0.2em] text-xs">
                System Access
              </h5>
              <ul className="space-y-4 font-bold text-white text-sm">
                <li>
                  <Link
                    to="/book-appointment"
                    className="hover:text-[#FFD700] transition-colors flex items-center justify-center md:justify-start gap-3"
                  >
                    <FiArrowRight className="text-[#FFD700]" /> Book Appointment
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-[#FFD700] transition-colors flex items-center justify-center md:justify-start gap-3"
                  >
                    <FiShield className="text-[#FFD700]" /> Security Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Standards Column */}
            <div className="space-y-6 text-center md:text-left">
              <h5 className="text-[#FFD700] font-black uppercase tracking-[0.2em] text-xs">
                Compliance
              </h5>
              <ul className="space-y-4 font-bold text-blue-100/80 text-sm">
                <li>ISO 25010 Quality Model</li>
                <li>Data Privacy Act 2012</li>
                <li>RTU Pasig & Boni</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-blue-200/60 text-center">
            <p>© {new Date().getFullYear()} UniVentry Capstone Project.</p>
            <p>Department of Computer Studies</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
