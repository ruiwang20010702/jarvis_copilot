import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Cpu, FileText, User, Server, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store';
import { resetRoom } from '../src/sync';

const STEPS = [
  { icon: Server, text: "正在连接课堂..." },
  { icon: User, text: "加载学生档案..." },
  { icon: Cpu, text: "分析学习偏好..." },
  { icon: FileText, text: "AI 生成个性化文章..." },
];

const Loading: React.FC = () => {
  const navigate = useNavigate();
  const userRole = useGameStore((state) => state.userRole);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!userRole) navigate('/');

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => setIsComplete(true), 600);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, userRole]);

  const handleEnterClass = () => {
    // 进入教室时清空房间状态，确保新课程从空白开始
    resetRoom();
    navigate('/class');
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
        
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-[150px] animate-pulse" />
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[150px]" />
      </div>

      <div className="z-10 w-full max-w-md px-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
        >
            <h2 className="text-lg font-medium text-brand-400 tracking-[0.2em] uppercase mb-4">系统初始化</h2>
            <div className="h-1 w-32 bg-slate-800 mx-auto rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-brand-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                    initial={{ width: "0%" }}
                    animate={{ width: isComplete ? "100%" : `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </motion.div>

        <div className="space-y-6 pl-4">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isDone = index < currentStep || (index === currentStep && isComplete);
            const isPending = index > currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex items-center gap-5"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-500
                    ${isDone ? 'bg-green-500/20 border-green-500 text-green-400' : 
                      isActive ? 'bg-brand-500/20 border-brand-400 text-brand-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 
                      'border-slate-800 text-slate-800'}`}
                >
                    {isDone ? (
                        <Check size={14} />
                    ) : isActive ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    )}
                </div>
                <span className={`text-lg font-light tracking-wide transition-colors duration-300 ${isActive || isDone ? 'text-slate-100' : 'text-slate-600'}`}>
                    {step.text}
                </span>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
            {isComplete && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mt-16 flex justify-center"
                >
                    <button 
                        onClick={handleEnterClass}
                        className="group relative flex items-center gap-3 px-8 py-3 bg-white text-slate-900 rounded-full font-semibold hover:bg-brand-50 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <span>进入课堂</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Loading;