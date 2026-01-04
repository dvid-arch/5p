import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Target, Award, Lightbulb, Video, Headphones, PenTool, MessageCircle, Brain, TrendingUp, Star } from 'lucide-react';

const CurriculumLearningPlatform = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentMode, setCurrentMode] = useState('text');
  const [studentProfile, setStudentProfile] = useState({
    name: 'Alex',
    grade: 9,
    subject: 'biology',
    learningStyle: 'visual',
    masteredObjectives: ['bio_9.1.1', 'bio_9.1.5'],
    currentStreak: 5
  });
  const [showProgress, setShowProgress] = useState(false);
  const [activeObjective, setActiveObjective] = useState(null);
  const messagesEndRef = useRef(null);

  // Curriculum Database
  const curriculum = {
    biology_grade9: {
      objectives: [
        {
          id: "bio_9.1.1",
          title: "Cell Structure Basics",
          mastered: true,
          prerequisites: [],
          connections: ["bio_9.2.3", "bio_9.3.1"],
          naturalQuestions: ["What are cells made of?", "How do cells work?"]
        },
        {
          id: "bio_9.1.5", 
          title: "Chemical Elements in Living Things",
          mastered: true,
          prerequisites: [],
          connections: ["bio_9.2.3"],
          naturalQuestions: ["What elements are in living things?"]
        },
        {
          id: "bio_9.2.3",
          title: "Photosynthesis Process",
          mastered: false,
          prerequisites: ["bio_9.1.1", "bio_9.1.5"],
          connections: ["bio_9.3.1", "bio_9.4.2"],
          naturalQuestions: ["How do plants make food?", "Why are leaves green?", "Why do plants need sunlight?"]
        },
        {
          id: "bio_9.3.1",
          title: "Cellular Respiration",
          mastered: false,
          prerequisites: ["bio_9.2.3"],
          connections: ["bio_9.4.1"],
          naturalQuestions: ["How do we get energy from food?", "What happens when we breathe?"]
        }
      ]
    }
  };

  // AI Response System
  const aiResponses = {
    "why do plants need sunlight": {
      objectiveId: "bio_9.2.3",
      mode: "video",
      response: "Great question! Plants need sunlight for photosynthesis - it's like their way of cooking! 🌱 Let me show you this amazing process where plants capture light energy and turn it into food (glucose). The chlorophyll in leaves acts like tiny solar panels!",
      followUp: "That's fascinating how plants make glucose, right? I'm wondering... what do you think animals like us do with that glucose when we eat plants?",
      nextObjective: "bio_9.3.1"
    },
    "how do plants make food": {
      objectiveId: "bio_9.2.3", 
      mode: "doodle",
      response: "Perfect question! Plants are basically nature's chefs! 👨‍🍳 Through photosynthesis, they combine sunlight, carbon dioxide from air, and water from their roots to create glucose (sugar) and oxygen. Let's draw this out - it's easier to see than explain!",
      followUp: "Now that you understand how plants create food, what do you think happens to all that oxygen they produce as a bonus?",
      nextObjective: "bio_9.3.1"
    },
    "what happens when we eat plants": {
      objectiveId: "bio_9.3.1",
      mode: "text",
      response: "Brilliant connection! When we eat plants (or animals that ate plants), we're basically getting that stored solar energy! Our cells break down the glucose through cellular respiration - it's like the opposite of photosynthesis. We use oxygen to 'burn' glucose and release energy for everything we do!",
      followUp: "This is so cool - you're seeing how energy flows through living things! Want to explore how this process actually works inside our cells?",
      nextObjective: "bio_9.4.1"
    }
  };

  const modeIcons = {
    text: MessageCircle,
    video: Video, 
    audio: Headphones,
    doodle: PenTool
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Hey ${studentProfile.name}! 🌟 I'm excited to explore biology with you today. I remember you've mastered cell structure and chemical elements - impressive! What's got your curiosity sparked today?`,
      mode: 'text',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages([welcomeMessage]);
  }, []);

  const detectCurriculumObjective = (message) => {
    const lowerMessage = message.toLowerCase();
    
    for (const [key, response] of Object.entries(aiResponses)) {
      if (lowerMessage.includes(key) || key.split(' ').every(word => lowerMessage.includes(word))) {
        return response;
      }
    }
    
    // Default exploratory response
    return {
      objectiveId: null,
      mode: currentMode,
      response: "That's a fascinating question! Tell me more about what you're thinking - I love exploring ideas with curious minds like yours!",
      followUp: null,
      nextObjective: null
    };
  };

  const updateProgress = (objectiveId) => {
    if (objectiveId) {
      const objective = curriculum.biology_grade9.objectives.find(obj => obj.id === objectiveId);
      if (objective && !objective.mastered) {
        objective.mastered = true;
        setStudentProfile(prev => ({
          ...prev,
          masteredObjectives: [...prev.masteredObjectives, objectiveId],
          currentStreak: prev.currentStreak + 1
        }));
        setActiveObjective(objective);
        
        // Show celebration
        setTimeout(() => {
          const celebrationMessage = {
            id: Date.now() + 1,
            type: 'achievement',
            content: `🎉 Wow! You just mastered "${objective.title}"! You're really understanding how living things work at a fundamental level. That's huge!`,
            mode: 'text',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, celebrationMessage]);
        }, 2000);
      }
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user', 
      content: inputMessage,
      mode: currentMode,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);

    // AI Response Logic
    setTimeout(() => {
      const aiResponse = detectCurriculumObjective(inputMessage);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.response,
        mode: aiResponse.mode,
        timestamp: new Date().toLocaleTimeString(),
        objectiveId: aiResponse.objectiveId
      };

      setMessages(prev => [...prev, aiMessage]);
      updateProgress(aiResponse.objectiveId);

      // Follow-up question to guide curriculum
      if (aiResponse.followUp) {
        setTimeout(() => {
          const followUpMessage = {
            id: Date.now() + 2,
            type: 'ai',
            content: aiResponse.followUp,
            mode: 'text',
            timestamp: new Date().toLocaleTimeString(),
            isFollowUp: true
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 3000);
      }
    }, 1500);

    setInputMessage('');
  };

  const getMasteryPercentage = () => {
    const total = curriculum.biology_grade9.objectives.length;
    const mastered = curriculum.biology_grade9.objectives.filter(obj => obj.mastered).length;
    return Math.round((mastered / total) * 100);
  };

  const getAvailableObjectives = () => {
    return curriculum.biology_grade9.objectives.filter(obj => {
      return !obj.mastered && obj.prerequisites.every(prereq => 
        studentProfile.masteredObjectives.includes(prereq)
      );
    });
  };

  const renderMessage = (message) => {
    const ModeIcon = modeIcons[message.mode];
    
    return (
      <div key={message.id} className={`flex gap-3 p-4 ${
        message.type === 'user' ? 'bg-blue-50 ml-12' : 
        message.type === 'achievement' ? 'bg-green-50' : 'bg-gray-50 mr-12'
      } rounded-xl mb-3`}>
        {message.type !== 'user' && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ModeIcon size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500 capitalize">{message.mode} mode</span>
            <span className="text-xs text-gray-400">{message.timestamp}</span>
            {message.objectiveId && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                <Target size={10} />
                Learning: {curriculum.biology_grade9.objectives.find(obj => obj.id === message.objectiveId)?.title}
              </span>
            )}
            {message.type === 'ai' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1">
                <Brain size={10} />
                AI selected {message.mode}
              </span>
            )}
          </div>
          
          <div className={`${message.type === 'achievement' ? 'font-semibold text-green-800' : 'text-gray-800'}`}>
            {message.content}
          </div>
          
          {message.mode === 'video' && (
            <div className="mt-3 w-full h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white">
              <Video size={32} />
              <span className="ml-2">Photosynthesis Animation</span>
            </div>
          )}
          
          {message.mode === 'doodle' && (
            <div className="mt-3 w-full h-40 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <PenTool size={32} className="text-gray-400" />
              <span className="ml-2 text-gray-500">Interactive Drawing Canvas</span>
            </div>
          )}
        </div>
        
        {message.type === 'user' && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            {studentProfile.name[0]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex h-screen">
        {/* Progress Sidebar */}
        <div className={`${showProgress ? 'w-80' : 'w-16'} bg-white shadow-lg transition-all duration-300 border-r border-gray-200`}>
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Brain className="text-purple-600" size={20} />
              {showProgress && <span className="font-semibold text-gray-800">Learning Journey</span>}
            </button>
          </div>
          
          {showProgress && (
            <div className="p-4 space-y-4">
              {/* Progress Stats */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Biology Progress</span>
                  <Star size={16} />
                </div>
                <div className="text-2xl font-bold">{getMasteryPercentage()}%</div>
                <div className="text-sm opacity-90">{studentProfile.currentStreak} day streak! 🔥</div>
              </div>
              
              {/* Learning Objectives */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Learning Map
                </h3>
                <div className="space-y-2">
                  {curriculum.biology_grade9.objectives.map(objective => (
                    <div key={objective.id} className={`p-3 rounded-lg border ${
                      objective.mastered 
                        ? 'bg-green-50 border-green-200' 
                        : getAvailableObjectives().includes(objective)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {objective.mastered && <Award size={14} className="text-green-600" />}
                        {getAvailableObjectives().includes(objective) && <Lightbulb size={14} className="text-blue-600" />}
                        <span className="text-sm font-medium">{objective.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Available Topics */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Ready to Explore
                </h3>
                <div className="space-y-2">
                  {getAvailableObjectives().map(objective => (
                    <div key={objective.id}>
                      {objective.naturalQuestions.map(question => (
                        <button
                          key={question}
                          onClick={() => setInputMessage(question)}
                          className="w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                        >
                          "{question}"
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Learning with AI</h1>
                <p className="text-sm text-gray-600">Biology • Grade 9 • Natural conversation mode</p>
              </div>
              
              {/* Mode Selector */}
              <div className="flex gap-2">
                {Object.entries(modeIcons).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    onClick={() => setCurrentMode(mode)}
                    className={`p-2 rounded-lg transition-colors ${
                      currentMode === mode 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={`${mode} mode`}
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${
                    currentMode === 'text' ? 'bg-blue-100 text-blue-600' :
                    currentMode === 'video' ? 'bg-red-100 text-red-600' :
                    currentMode === 'audio' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {React.createElement(modeIcons[currentMode], { size: 16 })}
                  </div>
                  <span className="text-sm text-gray-600 capitalize">{currentMode} mode active</span>
                </div>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything about biology... I'll guide our conversation naturally!"
                  className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumLearningPlatform;