'use client';

import { useCallback, useRef, useState } from 'react';

interface UseSpeechAPIOptions {
    /** 인식 언어 (기본: en-US) */
    language?: string;
    /** TTS 음성 선택 (기본: 자동) */
    voiceIndex?: number;
}

/**
 * Web Speech API를 통한 STT(음성 인식) 및 TTS(음성 합성)를 제공하는 훅
 *
 * @param options - 음성 설정 (언어, 음성 선택)
 * @returns STT, TTS 메서드 및 상태 객체
 * @example
 * const { startListening, speak, isListening, isSpeaking } = useSpeechAPI({ language: 'en-US' });
 */
export function useSpeechAPI(options: UseSpeechAPIOptions = {}) {
    const { language = 'en-US', voiceIndex = 0 } = options;
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recognizedText, setRecognizedText] = useState('');

    // STT: 음성 인식 시작
    const startListening = useCallback(
        (onResult?: (text: string) => void) => {
            setError(null);
            setRecognizedText('');

            const SpeechRecognition =
                window.SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setError('Speech Recognition not supported in this browser');
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.language = "en-US";
            recognition.interimResults = true;
            recognition.continuous = false;

            recognition.onstart = () => {
                console.log('start :::::')
                setIsListening(true);
            };

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';


                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript + ' ';
                    } else {
                        interim += transcript;
                    }
                }

                const text = (final || interim).trim();

                console.log('text !!!!!! ', text);
                setRecognizedText(text);
                onResult?.(text);
            };

            recognition.onerror = (event) => {
                setError(`Speech Recognition error: ${event.error}`);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        },
        [language]
    );

    // STT: 음성 인식 중지
    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    // TTS: 음성 합성 및 재생
    const speak = useCallback(
        (text: string, onComplete?: () => void) => {
            if (!text.trim()) return;

            setError(null);
            setIsSpeaking(true);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language;
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;

            // 사용 가능한 음성 선택
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > voiceIndex) {
                utterance.voice = voices[voiceIndex];
            }

            utterance.onend = () => {
                setIsSpeaking(false);
                onComplete?.();
            };

            utterance.onerror = (event) => {
                setError(`Speech Synthesis error: ${event.error}`);
                setIsSpeaking(false);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.cancel(); // 이전 재생 중단
            window.speechSynthesis.speak(utterance);
        },
        [language, voiceIndex]
    );

    // TTS: 재생 중지
    const stopSpeaking = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return {
        // STT
        startListening,
        stopListening,
        isListening,
        recognizedText,

        // TTS
        speak,
        stopSpeaking,
        isSpeaking,

        // 상태
        error,
        setError,
    };
}
