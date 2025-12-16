/**
 * Audio Recording Service
 * 音频录制服务 - 使用 MediaRecorder API
 */

export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;

    /**
     * 开始录音
     */
    async startRecording(): Promise<boolean> {
        try {
            // 请求麦克风权限
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            });

            // 创建 MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.audioChunks = [];

            // 收集音频数据
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start(100); // 每 100ms 收集一次数据
            console.log('[AudioRecorder] Recording started');
            return true;
        } catch (error) {
            console.error('[AudioRecorder] Failed to start recording:', error);
            return false;
        }
    }

    /**
     * 停止录音并返回音频 Blob
     */
    async stopRecording(): Promise<Blob | null> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                console.warn('[AudioRecorder] No active recording');
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                // 合并音频数据
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                console.log(`[AudioRecorder] Recording stopped, size: ${audioBlob.size} bytes`);

                // 释放麦克风
                this.cleanup();

                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * 取消录音
     */
    cancelRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        this.cleanup();
        console.log('[AudioRecorder] Recording cancelled');
    }

    /**
     * 清理资源
     */
    private cleanup(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    /**
     * 检查是否正在录音
     */
    isRecording(): boolean {
        return this.mediaRecorder?.state === 'recording';
    }
}

// 单例实例
export const audioRecorder = new AudioRecorder();
