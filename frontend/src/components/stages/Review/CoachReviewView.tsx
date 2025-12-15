import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store';

/**
 * 教师端结束阶段组件
 * CoachReviewView - 简单战报
 */
export const CoachReviewView: React.FC = () => {
  const navigate = useNavigate();
  const { reset, setStage } = useGameStore();
  const [reportGenerated, setReportGenerated] = React.useState(false);

  const handleGenerateReport = () => {
    setReportGenerated(true);
    // Trigger sync update via store (assuming 'reviewReportGenerated' is synced)
    useGameStore.setState({ reviewReportGenerated: true } as any);
  };

  const handleExit = () => {
    reset();
    navigate('/');
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-12 max-w-2xl text-center border-2 border-[#E0F7FF]">
        <div className="text-6xl mb-6">📊</div>
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A0E9] to-[#0077B5] mb-4">
          战报已生成
        </h2>
        <p className="text-xl text-slate-600 mb-8">
          Alex 本节课表现优秀，完成了所有学习目标。
        </p>
        {!reportGenerated ? (
          <button
            onClick={handleGenerateReport}
            className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 mb-4"
          >
            生成战报 & 庆祝
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-emerald-600 font-bold animate-pulse">
              🎉 战报已发送给学生
            </div>
            <button
              onClick={handleExit}
              className="px-12 py-4 bg-slate-200 text-slate-600 text-xl font-bold rounded-full hover:bg-slate-300 transition-all duration-300"
            >
              结束课程
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

