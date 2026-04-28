/**
 * 메시지 입력 및 전송 박스
 *
 * Type 모드: 텍스트 직접 입력
 * Speak 모드: 음성 인식(STT) → AI 응답 생성 → 음성 재생(TTS)
 *
 * @module components/chat/detail/send-message-box
 */

'use client';

import { useCallback, useState } from 'react';
import { Button } from '@langjournal/ui/components/button';
import { Icon } from '@langjournal/ui/components/icon';
import { Input } from '@langjournal/ui/components/input';
import { Typography } from '@langjournal/ui/components/typography';
import { useSpeechAPI } from '@/hooks/useSpeechAPI';

type InputMode = 'type' | 'speak';

interface SendMessageBoxProps {
    /** 메시지 전송 핸들러 (Type 모드) */
    onSend: (text: string) => Promise<void>;
    /** Speak 모드에서 음성 입력 처리 (STT → LLM → TTS) */
    onSpeak?: (text: string) => Promise<string>;
    /** AI 응답 생성 중 여부 */
    disabled: boolean;
    /** TTS 언어 설정 */
    language?: string;
}

export const SendMessageBox = ({
    onSend,
    onSpeak,
    disabled,
    language = 'en-US',
}: SendMessageBoxProps) => {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<InputMode>('type');

    const {
        startListening,
        stopListening,
        isListening,
        recognizedText,
        speak,
        isSpeaking,
        error: speechError,
    } = useSpeechAPI({ language });

    const [isSpeakProcessing, setIsSpeakProcessing] = useState(false);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || disabled) return;
        setInput('');
        await onSend(trimmed);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSpeakStart = useCallback(() => {
        if (disabled || !onSpeak) return;
        startListening();
    }, [disabled, onSpeak, startListening]);

    const handleSpeakStop = useCallback(async () => {
        stopListening();
        setIsSpeakProcessing(true);

        try {
            const text = recognizedText.trim();
            if (!text) {
                setIsSpeakProcessing(false);
                return;
            }

            // LLM 응답 생성 (onSpeak에서 LLM 호출 + 텍스트 반환)
            const response = await onSpeak(text);

            // TTS로 응답 재생
            speak(response);
        } catch (err) {
            console.error('Speak mode error:', err);
        } finally {
            setIsSpeakProcessing(false);
        }
    }, [recognizedText, onSpeak, stopListening, speak]);

    return (
        <div className="p-4 border-t">
            <div className="mb-3">
                <Typography variant="label-sm" className="block mb-2">
                    INPUT MODE
                </Typography>
                <div className="flex gap-2">
                    <Button
                        variant={mode === 'type' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('type')}
                        disabled={disabled}
                    >
                        Type
                    </Button>
                    <Button
                        variant={mode === 'speak' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('speak')}
                        disabled={disabled || !onSpeak}
                    >
                        Speak
                    </Button>
                </div>
            </div>
            {/* Type 모드 */}
            {mode === 'type' && (
                <div className="flex items-center bg-white rounded-lg h-14 px-6 gap-2">
                    <Input
                        className="flex-1"
                        placeholder="Message Scribe AI..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                    />
                    <Button
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        onClick={handleSend}
                        disabled={disabled || !input.trim()}
                    >
                        <Icon name="send" alt="Send Icon" />
                    </Button>
                </div>
            )}

            {/* Speak 모드 */}
            {mode === 'speak' && (
                <div className="space-y-2">
                    {/* 인식된 텍스트 표시 */}
                    {recognizedText && (
                        <div className="bg-blue-50 rounded-lg p-3">
                            <Typography variant="body-sm">
                                You: {recognizedText}
                            </Typography>
                        </div>
                    )}

                    {/* 음성 녹음 제어 버튼 */}
                    <div className="flex items-center gap-2">
                        <Button
                            className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                                isListening
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                            onClick={isListening ? handleSpeakStop : handleSpeakStart}
                            disabled={isSpeakProcessing}
                        >
                            {isSpeakProcessing ? (
                                'Processing...'
                            ) : isListening ? (
                                <>
                                    <span className="animate-pulse">●</span> Stop
                                </>
                            ) : (
                                <>
                                    <Icon name="mic" alt="Microphone" className="mr-2" /> Start Listening
                                </>
                            )}
                        </Button>
                    </div>

                    {/* 에러 메시지 */}
                    {speechError && (
                        <Typography variant="body-sm" className="text-red-500">
                            {speechError}
                        </Typography>
                    )}
                </div>
            )}
        </div>
    );
};
