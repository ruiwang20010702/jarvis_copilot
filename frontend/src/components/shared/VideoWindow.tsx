import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Volume2, VolumeX } from 'lucide-react';

interface VideoWindowProps {
    /**
     * 布局ID - 用于跨阶段动画
     * 学生端统一用 'student-video'，教师端用 'coach-video'
     */
    layoutId: string;
    
    /**
     * 容器className - 控制尺寸和位置
     */
    className?: string;
    
    /**
     * 是否显示在线状态
     */
    showOnlineStatus?: boolean;
    
    /**
     * 在线状态文字
     */
    statusText?: string;
    
    /**
     * 占位文字
     */
    placeholderText?: string;
    
    /**
     * 自定义样式
     */
    style?: React.CSSProperties;
    
    /**
     * 是否禁用 layout 动画（用于 fixed 定位场景）
     */
    disableLayoutAnimation?: boolean;
}

/**
 * 视频窗口组件 - 支持跨阶段平滑过渡动画
 * 使用 Framer Motion 的 layoutId 实现共享元素动画
 */
export const VideoWindow: React.FC<VideoWindowProps> = ({
    layoutId,
    className = '',
    showOnlineStatus = true,
    statusText = '在线',
    placeholderText = '学生视频连线中...',
    style = {},
    disableLayoutAnimation = false
}) => {
    const [isMuted, setIsMuted] = useState(false);

    return (
        <motion.div
            layoutId={disableLayoutAnimation ? undefined : layoutId}
            className={`overflow-hidden ${className}`}
            style={{
                aspectRatio: '16/9',
                ...style
            }}
            // 动画配置
            transition={{
                layout: {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1] // cubic-bezier 缓动
                }
            }}
        >
            {/* 背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                        <User size={28} className="text-white/60" />
                    </div>
                    <p className="text-xs font-medium text-white/50">{placeholderText}</p>
                </div>
            </div>

            {/* 左上角：在线状态 */}
            {showOnlineStatus && (
                <div className="absolute top-3 left-3 z-10">
                    <div 
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md" 
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] font-semibold text-white tracking-wide">{statusText}</span>
                    </div>
                </div>
            )}

            {/* 右下角：静音按钮 */}
            <div className="absolute bottom-3 right-3 z-10">
                <button 
                    className="w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => setIsMuted(!isMuted)}
                >
                    {isMuted ? <VolumeX size={14} className="text-white" /> : <Volume2 size={14} className="text-white" />}
                </button>
            </div>
        </motion.div>
    );
};

