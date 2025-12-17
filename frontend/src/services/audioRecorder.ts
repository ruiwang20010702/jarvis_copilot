/**
 * Audio Recording Service
 * 音频录制服务 - 使用 MediaRecorder API
 */

export class AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private currentMimeType: string = '';

    /**
     * 获取支持的 MIME 类型
     */
    private getSupportedMimeType(): string {
        // Groq Whisper 支持的格式优先级
        const mimeTypes = [
            'audio/mp4',
            'audio/mpeg',
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus',
            'audio/wav',
        ];

        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                console.log(`[AudioRecorder] Using MIME type: ${mimeType}`);
                return mimeType;
            }
        }

        console.warn('[AudioRecorder] No preferred MIME type supported, using default');
        return '';  // 使用浏览器默认
    }

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

            // 获取支持的 MIME 类型
            const mimeType = this.getSupportedMimeType();

            // 创建 MediaRecorder
            const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.currentMimeType = this.mediaRecorder.mimeType;
            console.log(`[AudioRecorder] Actual MIME type: ${this.currentMimeType}`);

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
                // 合并音频数据，使用实际录制的 MIME 类型
                const audioBlob = new Blob(this.audioChunks, { type: this.currentMimeType || 'audio/webm' });
                console.log(`[AudioRecorder] Recording stopped, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

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
