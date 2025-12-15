import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Headset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, UserRole } from '../store';
import { initSync } from '../src/sync';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const setUserRole = useGameStore((state) => state.setUserRole);

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    initSync(role);
    navigate('/loading');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />

      <motion.div
        className="z-10 flex flex-col items-center gap-14 w-full max-w-6xl px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center space-y-3" variants={cardVariants}>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-800 drop-shadow-sm">
            Hello, I'm Jarvis
          </h1>
          <p className="text-slate-500 text-xl font-serif italic tracking-wide">
            请选择你的身份
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-stretch max-w-4xl">
          {/* Student Card */}
          <motion.button
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect('student')}
            className="group relative flex-1 min-h-[340px] bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 shadow-2xl hover:shadow-brand-500/20 transition-all duration-300"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-100 to-white flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
              <GraduationCap className="w-10 h-10 text-brand-600" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">我是学生</h2>
              <p className="text-slate-500 font-medium">开启沉浸式阅读体验</p>
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-400/30 rounded-[2rem] transition-colors duration-300" />
          </motion.button>

          {/* Coach Card */}
          <motion.button
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect('coach')}
            className="group relative flex-1 min-h-[340px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 shadow-2xl hover:shadow-black/50 transition-all duration-300"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
              <Headset className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">我是教练</h2>
              <p className="text-slate-400 font-medium">进入 Copilot 控制台</p>
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-500/30 rounded-[2rem] transition-colors duration-300" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;