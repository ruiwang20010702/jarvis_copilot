import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Swords, Gem, Zap } from 'lucide-react';
import { useGameStore } from '../../../../store';

/**
 * 学生端结束阶段组件
 * StudentReviewView - 庆祝页面 with 勋章墙
 */
export const StudentReviewView: React.FC = () => {
  const navigate = useNavigate();
  const { reset, vocabList, vocabStatus, reviewReportGenerated } = useGameStore() as any;
  const [showCelebration, setShowCelebration] = React.useState(false);

  useEffect(() => {
    if (reviewReportGenerated) {
      setShowCelebration(true);
    }
  }, [reviewReportGenerated]);

  const vocabCount = Object.keys(vocabStatus).filter(word => vocabStatus[word] === 'mastered').length || vocabList.length;
  const surgeryCount = 3;
  const attentionScore = 95;

  const handleExit = () => {
    reset();
    navigate('/');
  };

  // 烟花特效：组件加载时触发（品牌双色：蓝+黄）
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
      colors: ['#00A0E9', '#FFDE00']
    };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, [showCelebration]);

  if (!showCelebration) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">⏳</div>
          <h2 className="text-3xl font-bold text-slate-600">
            等待老师生成战报...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="text-center mb-12"
      >
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00A0E9] to-[#0077B5]">
          🎉 挑战成功！
        </h1>
        <p className="text-3xl font-bold text-slate-600 mt-4">太棒了！</p>
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-8 max-w-6xl w-full px-10"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        <MedalCard
          icon={Swords}
          title="击败大魔王"
          subtitle="长难句征服者"
          count={surgeryCount}
          unit="个长难句"
          theme="blue"
          delay={0}
        />

        <MedalCard
          icon={Gem}
          title="收获宝石"
          subtitle="词汇猎人"
          count={vocabCount}
          unit="个生词"
          theme="yellow"
          delay={0.2}
        />

        <MedalCard
          icon={Zap}
          title="专注度"
          subtitle="超级专注"
          count={attentionScore}
          unit="%"
          theme="yellow"
          delay={0.4}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleExit}
        className="mt-16 px-16 py-5 bg-gradient-to-r from-[#00A0E9] to-[#0088CC] text-white text-2xl font-bold rounded-full shadow-2xl hover:shadow-[#00A0E9]/50 transition-all duration-300"
      >
        🚪 退出课堂
      </motion.button>
    </div>
  );
};

// Reusable Medal Card Component
interface MedalCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  count: number;
  unit: string;
  theme: 'blue' | 'yellow';
  delay: number;
}

const MedalCard: React.FC<MedalCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  count,
  unit,
  theme,
  delay,
}) => {
  const themeStyles = {
    blue: {
      border: 'border-[#E0F7FF]',
      shadow: 'shadow-[0_8px_30px_rgba(0,160,233,0.12)]',
      hoverShadow: 'hover:shadow-[0_12px_40px_rgba(0,160,233,0.2)]',
      bubbleBg: 'bg-gradient-to-br from-[#E0F7FF] to-[#00A0E9]/20',
      iconColor: 'text-[#00A0E9]',
      iconShadow: 'drop-shadow-[0_2px_8px_rgba(0,160,233,0.3)]',
      numberGradient: 'text-transparent bg-clip-text bg-gradient-to-r from-[#00A0E9] to-[#0077B5]',
    },
    yellow: {
      border: 'border-[#FFFBE6]',
      shadow: 'shadow-[0_8px_30px_rgba(255,222,0,0.12)]',
      hoverShadow: 'hover:shadow-[0_12px_40px_rgba(255,222,0,0.2)]',
      bubbleBg: 'bg-gradient-to-br from-[#FFFBE6] to-[#FFDE00]/30',
      iconColor: 'text-[#FFC400]',
      iconShadow: 'drop-shadow-[0_2px_8px_rgba(255,196,0,0.3)]',
      numberGradient: 'text-[#E6C200]',
    },
  };

  const styles = themeStyles[theme];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50, scale: 0.8 },
        show: { opacity: 1, y: 0, scale: 1 },
      }}
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-white border-2 ${styles.border} ${styles.shadow} ${styles.hoverShadow} rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300`}
    >
      <div className={`w-24 h-24 rounded-full ${styles.bubbleBg} backdrop-blur-sm flex items-center justify-center mb-6 ${styles.iconShadow}`}>
        <Icon size={48} className={styles.iconColor} strokeWidth={2.5} />
      </div>

      <h3 className={`text-2xl font-bold ${styles.iconColor} mb-2`}>{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>

      <div className="flex items-baseline gap-2">
        <span className={`text-6xl font-black ${styles.numberGradient}`}>{count}</span>
        <span className="text-2xl text-slate-600 font-semibold">{unit}</span>
      </div>
    </motion.div>
  );
};

