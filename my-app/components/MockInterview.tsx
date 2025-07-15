'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, RotateCcw, Play, Pause, Star, MessageSquare, Video, VideoOff, Camera, UserCircle, Bot } from 'lucide-react';
import { GeminiService, getFallbackResponse, testGeminiAPI } from '@/lib/gemini';
import { createPracticeSession, PracticeSessionData, createPracticeSummary } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

// Type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  questionType?: string;
  expectedAnswer?: string;
  userRating?: number;
  feedback?: string;
}

interface InterviewSession {
  id: string;
  role: string;
  level: string;
  messages: Message[];
  startTime: Date;
  isActive: boolean;
}

interface QuestionFeedback {
  question: string;
  userAnswer: string;
  expectedAnswer: string;
  rating: number;
  feedback: string;
  category: string;
}

const MockInterview = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [selectedRole, setSelectedRole] = useState('frontend');
  const [selectedLevel, setSelectedLevel] = useState('entry');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [detailedFeedback, setDetailedFeedback] = useState<QuestionFeedback[]>([]);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<string>('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const [fullTranscript, setFullTranscript] = useState('');
  const fullTranscriptRef = useRef('');
  let recognitionRestartAttempts = 0;
  const MAX_RESTART_ATTEMPTS = 5;
  // 1. Add state for save status
  const [saveStatus, setSaveStatus] = useState<string>('');

  const roles = [
    { value: 'frontend', label: 'Frontend Developer' },
    { value: 'react', label: 'React Developer' },
    { value: 'ui', label: 'UI Engineer' },
    { value: 'ux', label: 'UX Designer' },
    { value: 'web', label: 'Web Developer' }
  ];

  const levels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  useEffect(() => {
    fullTranscriptRef.current = fullTranscript;
  }, [fullTranscript]);

  const startNewInterview = () => {
    resetInterview(); // Stop previous interview and reset state
    // Delay to ensure state is reset before starting new session
    setTimeout(() => {
      const session: InterviewSession = {
        id: Date.now().toString(),
        role: selectedRole,
        level: selectedLevel,
        messages: [],
        startTime: new Date(),
        isActive: true
      };

      // Add initial greeting
      const greeting = getInitialGreeting(selectedRole, selectedLevel);
      session.messages.push({
        id: '1',
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      });

      setCurrentSession(session);
      // Speak the initial greeting
      speak(greeting);
    }, 0);
  };

  const getInitialGreeting = (role: string, level: string) => {
    const roleLabels: Record<string, string> = {
      frontend: 'Frontend Developer',
      react: 'React Developer',
      ui: 'UI Engineer',
      ux: 'UX Designer',
      web: 'Web Developer'
    };

    const levelLabels: Record<string, string> = {
      entry: 'entry-level',
      mid: 'mid-level',
      senior: 'senior-level'
    };

    return `Hello! I'm your mock interview interviewer for a ${levelLabels[level]} ${roleLabels[role]} position. I'll be asking you questions to assess your knowledge, experience, and fit for the role.\n\nLet's begin with some questions about your background and experience. Please answer as you would in a real interview setting.\n\nWhat motivated you to pursue a career in frontend development, specifically as a ${levelLabels[level]} ${roleLabels[role]}?`;
  };

  const sendMessage = async (content: string) => {
    if (!currentSession || !content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage]
    };

    setCurrentSession(updatedSession);
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual Gemini API call)
      const aiResponse = await generateAIResponse(content, currentSession);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setCurrentSession({
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage]
      });

      // Speak Dr. Smith's response
      speak(aiResponse);
    } catch (error) {
      console.error('Error generating response:', error);
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your response right now. Could you please try again?",
        timestamp: new Date()
      };

      setCurrentSession({
        ...updatedSession,
        messages: [...updatedSession.messages, fallbackMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userInput: string, session: InterviewSession): Promise<string> => {
    try {
      // Check if Gemini API key is available
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      console.log('API Key available:', !!apiKey); // Debug log
      
      if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        console.log('Using Gemini API...'); // Debug log
        const geminiService = new GeminiService(apiKey);
        const context = {
          role: session.role,
          level: session.level,
          messages: session.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        };
        
        let prompt = `You are Dr. Smith, a friendly, professional healthcare interviewer. Conduct a realistic mock interview for a ${session.level} ${session.role} position. Your goal is to simulate a real human interviewer, not just a chatbot.

- Greet the candidate and introduce yourself at the start.
- Ask open-ended, relevant interview questions appropriate for the position and experience level.
- After each answer, respond naturally: acknowledge, encourage, or ask for clarification or follow-up details as a human would.
- Reference previous answers when appropriate.
- Use a warm, professional, and supportive tone.
- Do not just ask questions—react to the candidate's answers as a real interviewer would.
- Occasionally provide encouragement or brief feedback, but do not summarize the whole interview until the end.
- Keep responses concise (2-4 sentences) and avoid sounding robotic.

Current interview context:
- Position: ${session.role}
- Experience Level: ${session.level}
- Number of exchanges: ${context.messages.length}

Conversation so far:
`;

        context.messages.forEach((message) => {
          prompt += `${message.role === 'user' ? 'Candidate' : 'Dr. Smith'}: ${message.content}\n`;
        });

        prompt += `\nContinue the interview as Dr. Smith. If the candidate just answered, respond naturally and ask a relevant follow-up or next question. If the candidate asked a question, answer it professionally. Only end the interview if the candidate says they are finished or asks to end.\n\nDr. Smith:`;
        
        return await geminiService.generateInterviewResponse(context);
      } else {
        console.log('Using fallback responses...'); // Debug log
        // Fallback to predefined responses
        const fallbackResponse = getFallbackResponse(session.messages.length, session.role);
        console.log('Fallback response:', fallbackResponse); // Debug log
        return fallbackResponse;
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
        console.log('Rate limit exceeded, using fallback responses');
      }
      
      // Fallback to predefined responses
      const fallbackResponse = getFallbackResponse(session.messages.length, session.role);
      console.log('Error fallback response:', fallbackResponse); // Debug log
      return fallbackResponse;
    }
  };

  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Please allow camera and microphone access to use recording features.');
    }
  };

  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      // Start recording
      if (!mediaStream) {
        await startMediaStream();
      }
      
      if (mediaStream) {
        const mediaRecorder = new MediaRecorder(mediaStream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        videoChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
          setRecordedBlob(blob);
          setRecordedUrl(URL.createObjectURL(blob));
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const toggleVideoRecording = async () => {
    if (!isVideoRecording) {
      // Start video recording
      if (!mediaStream) {
        await startMediaStream();
      }
      
      if (mediaStream) {
        const mediaRecorder = new MediaRecorder(mediaStream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        videoChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
          setRecordedBlob(blob);
          setRecordedUrl(URL.createObjectURL(blob));
        };
        
        mediaRecorder.start();
        setIsVideoRecording(true);
      }
    } else {
      // Stop video recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsVideoRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedUrl && videoRef.current) {
      videoRef.current.src = recordedUrl;
      videoRef.current.play();
      setIsPlayingRecording(true);
    }
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    setRecordedUrl('');
    setIsPlayingRecording(false);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (!recognitionRef.current) {
      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          console.log('Speech recognition started');
        };

        recognitionRef.current.onresult = (event: any) => {
          let fullFinalTranscript = '';
          let interimTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              fullFinalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          fullTranscriptRef.current = fullFinalTranscript;
          setFullTranscript(fullFinalTranscript);
          setTranscribedText(fullFinalTranscript + interimTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            alert('Please allow microphone access for speech recognition.');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          console.log('Speech recognition ended');
          // Auto-restart if user did not manually stop, with timeout and error handling
          if (isListening && recognitionRef.current) {
            if (recognitionRestartAttempts < MAX_RESTART_ATTEMPTS) {
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                  recognitionRestartAttempts++;
                } catch (err) {
                  console.warn('Recognition restart error:', err);
                }
              }, 300);
            } else {
              console.warn('Max recognition restart attempts reached.');
            }
          } else {
            recognitionRestartAttempts = 0;
          }
        };
      } else {
        console.error('Speech recognition not supported in this browser');
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      initializeSpeechRecognition();
    }

    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        recognitionRestartAttempts = 0;
      } else {
        recognitionRestartAttempts = 0;
        recognitionRef.current.start();
        setIsListening(true);
      }
    }
  };

  const sendTranscribedMessage = () => {
    if (fullTranscriptRef.current.trim()) {
      sendMessage(fullTranscriptRef.current.trim());
      setTranscribedText('');
      setFullTranscript('');
      fullTranscriptRef.current = '';
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    }
  };

  const generateDetailedFeedback = async () => {
    if (!currentSession) return;
    
    setIsGeneratingFeedback(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (apiKey) {
        const geminiService = new GeminiService(apiKey);
        
        // Generate detailed feedback for each question-answer pair
        const feedbackPromises = [];
        const userMessages = currentSession.messages.filter(msg => msg.role === 'user');
        const assistantMessages = currentSession.messages.filter(msg => msg.role === 'assistant');
        
        for (let i = 0; i < userMessages.length; i++) {
          const userAnswer = userMessages[i].content;
          const question = assistantMessages[i]?.content || 'Interview question';
          
          const feedbackPromise = geminiService.generateQuestionFeedback({
            role: currentSession.role,
            level: currentSession.level,
            question,
            userAnswer,
            questionNumber: i + 1
          });
          
          feedbackPromises.push(feedbackPromise);
        }
        
        const feedbackResults = await Promise.all(feedbackPromises);
        setDetailedFeedback(feedbackResults);
        
        // Generate overall feedback
        const context = {
          role: currentSession.role,
          level: currentSession.level,
          messages: currentSession.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        };
        
        const overallFeedback = await geminiService.generateInterviewFeedback(context);
        setFeedback(overallFeedback);

        // Save session data to Firebase
        if (user && currentSession) {
          // Calculate performance metrics
          const totalRating = feedbackResults.reduce((sum, item) => sum + item.rating, 0);
          const averageRating = totalRating / feedbackResults.length;
          const strongAnswers = feedbackResults.filter(item => item.rating >= 4).length;
          const needImprovement = feedbackResults.filter(item => item.rating <= 3).length;
          
          // Calculate category totals
          const categories = {
            Communication: 0,
            TechnicalKnowledge: 0,
            ProblemSolving: 0,
            Collaboration: 0,
            Experience: 0
          };
          
          feedbackResults.forEach(item => {
            if (categories.hasOwnProperty(item.category as keyof typeof categories)) {
              categories[item.category as keyof typeof categories] += item.rating;
            }
          });
          
          const sessionData: Omit<PracticeSessionData, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: user.uid,
            role: currentSession.role,
            level: currentSession.level,
            startTime: currentSession.startTime,
            endTime: new Date(),
            duration: Math.round((new Date().getTime() - currentSession.startTime.getTime()) / 60000), // Duration in minutes
            totalQuestions: feedbackResults.length,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            performanceSummary: {
              totalRating,
              strongAnswers,
              needImprovement,
              categories
            },
            questionFeedback: feedbackResults,
            overallFeedback: overallFeedback
          };
          
          await createPracticeSession(sessionData);
        }
      } else {
        // Fallback detailed feedback
        const fallbackFeedback = generateFallbackDetailedFeedback(currentSession);
        setDetailedFeedback(fallbackFeedback);
        setFeedback("Interview completed! Review your responses and ratings below. For AI-powered feedback, please set up your Gemini API key.");
      }
    } catch (error) {
      console.error('Error generating detailed feedback:', error);
      const fallbackFeedback = generateFallbackDetailedFeedback(currentSession);
      setDetailedFeedback(fallbackFeedback);
      setFeedback("Interview completed! Review your responses and ratings below. Your practice session has been recorded.");
    } finally {
      setIsGeneratingFeedback(false);
      setShowFeedback(true);
    }
  };

  const generateFallbackDetailedFeedback = (session: InterviewSession): QuestionFeedback[] => {
    const userMessages = session.messages.filter(msg => msg.role === 'user');
    const assistantMessages = session.messages.filter(msg => msg.role === 'assistant');
    
    const categories = ['Communication', 'Technical Knowledge', 'Problem Solving', 'Collaboration', 'Experience'];
    const sampleExpectedAnswers = [
      "Demonstrate passion for the field with specific examples of projects or experiences that motivated your career choice.",
      "Show problem-solving approach: identify the issue, research solutions, implement fixes, and document the process.",
      "Mention specific resources: industry blogs, documentation, conferences, online courses, and community involvement.",
      "Highlight project management skills: planning, communication, version control, testing, and team collaboration.",
      "Discuss career goals with specific milestones: skill development, leadership roles, and industry contributions."
    ];
    
    return userMessages.map((userMsg, index) => ({
      question: assistantMessages[index]?.content || `Question ${index + 1}`,
      userAnswer: userMsg.content,
      expectedAnswer: sampleExpectedAnswers[index] || "Provide specific examples and demonstrate relevant knowledge and experience",
      rating: Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
      feedback: `Good response. Consider adding more specific examples and technical details to strengthen your answer.`,
      category: categories[index % categories.length]
    }));
  };

  const generateFeedback = async () => {
    await generateDetailedFeedback();
  };

  const endInterview = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        isActive: false
      });
      generateFeedback();
    }
  };

  const testAPI = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      setApiTestResult('No API key configured');
      return;
    }
    
    setApiTestResult('Testing API...');
    const isWorking = await testGeminiAPI(apiKey);
    setApiTestResult(isWorking ? 'API is working! ✅' : 'API test failed ❌');
  };

  // 2. Add a function to save the session
  const handleSaveSession = async () => {
    if (user && detailedFeedback.length > 0) {
      try {
        // Calculate performance metrics
        const totalRating = detailedFeedback.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = totalRating / detailedFeedback.length;
        const strongAnswers = detailedFeedback.filter(item => item.rating >= 4).length;
        const needImprovement = detailedFeedback.filter(item => item.rating <= 3).length;
        const categories = {
          Communication: 0,
          TechnicalKnowledge: 0,
          ProblemSolving: 0,
          Collaboration: 0,
          Experience: 0
        };
        detailedFeedback.forEach(item => {
          if (categories.hasOwnProperty(item.category as keyof typeof categories)) {
            categories[item.category as keyof typeof categories] += item.rating;
          }
        });
        // Only store userId, performanceSummary, and averageRating
        const sessionData = {
          userId: user.uid,
          performanceSummary: {
            totalRating,
            strongAnswers,
            needImprovement,
            categories
          },
          averageRating: Math.round(averageRating * 10) / 10,
          createdAt: new Date()
        };
        console.log('user:', user);
        console.log('sessionData:', sessionData);
        try {
          await createPracticeSummary(sessionData);
          setSaveStatus('Performance saved!');
        } catch (error) {
          console.error('Error saving performance:', error);
          setSaveStatus('Error saving performance.');
        }
      } catch (error) {
        setSaveStatus('Error saving performance.');
      }
    }
  };

  // Cleanup media streams and speech recognition on component unmount
  useEffect(() => {
    return () => {
      stopMediaStream();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [recordedUrl, isListening, stopMediaStream]);

  const resetInterview = () => {
    setCurrentSession(null);
    setShowFeedback(false);
    setFeedback('');
    setDetailedFeedback([]);
    deleteRecording();
    stopMediaStream();
  };

  // Text-to-speech function for AI Interviewer's responses
  function speak(text: string) {
    if (voiceEnabled && 'speechSynthesis' in window) {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en')) || null;
      utterance.rate = 0.9; // Slightly slower for more natural speech
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* AI Interviewer Header */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center space-x-4 mb-4 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow">
          <div className="w-16 h-16 rounded-full border-4 border-white shadow bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">AI Interviewer</div>
            <div className="text-sm text-blue-100">Professional Interview Assistant</div>
            <div className="text-xs text-blue-200">Powered by AI</div>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key_here' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs text-white">
              {process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key_here' 
                ? 'AI Powered' 
                : 'Demo Mode'}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Mock Interview</h2>
          <p className="text-blue-100">Practice your interview skills with AI-powered feedback</p>
          <div className="mt-2 flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key_here' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs text-blue-100">
              {process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key_here' 
                ? 'AI Powered (Gemini API Connected) - Rate limit: 15 req/min' 
                : 'Demo Mode (Using Predefined Questions)'}
            </span>
          </div>
        </div>

        {/* Interview Setup */}
        {!currentSession && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Interview Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Healthcare Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={startNewInterview}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Mock Interview
                </button>
                
                <div className="text-center">
                  <button
                    onClick={testAPI}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Test API Connection
                  </button>
                  {apiTestResult && (
                    <p className="text-xs mt-1 text-gray-600">{apiTestResult}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Session */}
        {currentSession && !showFeedback && (
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col min-h-[70vh]">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-6">
                {currentSession.messages.map((message, idx) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}> 
                    <div className={`max-w-[75%] ${message.role === 'user' ? 'ml-auto' : ''}`}> 
                      <div className={`flex items-center mb-1 ${message.role === 'user' ? 'justify-end' : ''}`}> 
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-2">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold mr-2">You</div>
                        )}
                        <span className="text-xs text-gray-400">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`rounded-2xl px-4 py-3 text-base ${message.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%]">
                      <div className="flex items-center mb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-2">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs text-gray-400">...</span>
                      </div>
                      <div className="rounded-2xl px-4 py-3 bg-gray-100 text-gray-800 animate-pulse">AI Interviewer is thinking...</div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Answer Section */}
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center shadow-inner">
              <div className="mb-2 text-center text-gray-700 font-medium">Speak your answer below</div>
              <button
                onClick={toggleSpeechRecognition}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 shadow-lg mb-3 border-4 ${isListening ? 'bg-red-500 text-white border-red-300 animate-pulse' : 'bg-blue-500 text-white border-blue-300 hover:bg-blue-600'}`}
                title={isListening ? 'Stop Listening' : 'Click to Speak'}
              >
                {isListening ? <MicOff size={40} /> : <Mic size={40} />}
              </button>
              <div className="w-full max-w-xl min-h-[48px] bg-white border border-blue-200 rounded-lg px-4 py-3 mb-2 text-lg text-gray-800 text-center">
                {transcribedText || fullTranscript || (isListening ? 'Listening...' : 'Click the mic and start speaking')}
              </div>
              <div className="flex space-x-3 mt-2">
                <button
                  onClick={sendTranscribedMessage}
                  className="px-5 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  disabled={!fullTranscript.trim()}
                >
                  Send Answer
                </button>
                <button
                  onClick={() => { setTranscribedText(''); setFullTranscript(''); fullTranscriptRef.current = ''; }}
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  disabled={!fullTranscript.trim() && !transcribedText.trim()}
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">Your answer will be sent to AI Interviewer. You can continue speaking to add more, or clear to start over.</div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={generateFeedback}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                disabled={!currentSession.isActive}
              >
                Result Interview
              </button>
              <button
                onClick={resetInterview}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center space-x-1"
              >
                <RotateCcw size={16} />
                <span>New Interview</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Section */}
        {showFeedback && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-yellow-500 mr-2" />
                <h3 className="text-xl font-semibold">Detailed Interview Feedback</h3>
              </div>
              
              {isGeneratingFeedback ? (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Generating detailed feedback...</span>
                </div>
              ) : (
                <>
                  {/* Overall Feedback */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Overall Assessment</h4>
                    <div className="prose max-w-none">
                      {feedback.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-3 text-blue-800">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Question-by-Question Feedback */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Question-by-Question Analysis</h4>
                    {detailedFeedback.map((item, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {item.category}
                              </span>
                              <span className="text-sm text-gray-500">Question {index + 1}</span>
                            </div>
                            <h5 className="font-medium text-gray-900 mb-2">{item.question}</h5>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-sm font-medium text-gray-700">
                              {item.rating}/5
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-medium text-gray-700 mb-2">Your Answer:</h6>
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-800">
                              {item.userAnswer}
                            </div>
                          </div>
                          <div>
                            <h6 className="font-medium text-gray-700 mb-2">Expected Answer:</h6>
                            <div className="bg-green-50 p-3 rounded text-sm text-gray-800">
                              {item.expectedAnswer}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <h6 className="font-medium text-gray-700 mb-2">Feedback:</h6>
                          <div className="bg-blue-50 p-3 rounded text-sm text-gray-800">
                            {item.feedback}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Statistics */}
                  {detailedFeedback.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {(detailedFeedback.reduce((sum, item) => sum + item.rating, 0) / detailedFeedback.length).toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">Average Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {detailedFeedback.filter(item => item.rating >= 4).length}
                          </div>
                          <div className="text-sm text-gray-600">Strong Answers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {detailedFeedback.filter(item => item.rating <= 3).length}
                          </div>
                          <div className="text-sm text-gray-600">Need Improvement</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {detailedFeedback.length}
                          </div>
                          <div className="text-sm text-gray-600">Total Questions</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* 3. Add the Save button and status message to the feedback/results section */}
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={startNewInterview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start New Interview
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Review Interview
                </button>
                <button
                  onClick={handleSaveSession}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={!!saveStatus}
                >
                  Save
                </button>
                {saveStatus && (
                  <span className="ml-4 text-green-700 font-semibold">{saveStatus}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterview; 