import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';

export default function AIChatbot({ onSelectProduct }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am Cloudy, your AI Shopping Assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend = inputValue) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // API call to AI Chat
      const response = await apiService.askAIChatbot(trimmed);
      
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.reply || "I am processing your request...",
        products: response.products || [],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("AI Chatbot error:", error);
      setMessages(prev => [...prev, {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I am having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleQuickReply = (text) => {
    handleSend(text);
  };

  const quickReplies = [
    "Recommend a laptop",
    "Find mechanical keyboards",
    "How do I track my order?",
    "Show workspace accessories"
  ];

  return (
    <div className="ai-chatbot-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 32px 0 rgba(79, 70, 229, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
          }}
          className="hover-scale pulse-glow"
        >
          <div style={{ position: 'relative' }}>
            <Bot size={28} />
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              border: '2px solid white'
            }} />
          </div>
        </button>
      )}

      {/* Chat Window with Glassmorphism */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            height: '520px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="fade-in-up"
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
              }}>
                <Bot size={22} />
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Cloudy Assistant <Sparkles size={14} color="#7c3aed" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }} className="pulse" />
                  Ask me anything
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4b5563',
                transition: 'background 0.2s'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              scrollBehavior: 'smooth'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', maxWidth: '85%', flexDirection: 'column' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      background: msg.sender === 'user' 
                        ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
                        : 'white',
                      color: msg.sender === 'user' ? 'white' : '#1f2937',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      boxShadow: msg.sender === 'user' 
                        ? '0 4px 15px rgba(79, 70, 229, 0.15)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                      border: msg.sender === 'user' ? 'none' : '1px solid rgba(0,0,0,0.05)'
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Dynamic Product Cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {msg.products.map(product => (
                        <div
                          key={product.id}
                          style={{
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px solid rgba(0,0,0,0.06)',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            gap: '12px'
                          }}
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              background: '#f3f4f6'
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '700', marginTop: '2px' }}>
                              ${product.price}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (onSelectProduct) {
                                onSelectProduct(product);
                              }
                            }}
                            style={{
                              background: '#e0e7ff',
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#4f46e5',
                              transition: 'all 0.2s'
                            }}
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(79, 70, 229, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5'
                }}>
                  <Bot size={16} />
                </div>
                <div className="typing-dots" style={{ display: 'flex', gap: '4px', padding: '10px 14px', background: 'white', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies list */}
          {messages.length === 1 && !isLoading && (
            <div style={{ padding: '0 20px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply)}
                  style={{
                    background: 'rgba(79, 70, 229, 0.06)',
                    border: '1px solid rgba(79, 70, 229, 0.12)',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#4f46e5',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  className="quick-reply-btn"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input Area */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <input
              type="text"
              placeholder="Ask Cloudy something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              className="chat-input"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              style={{
                background: inputValue.trim() ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e5e7eb',
                color: 'white',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: inputValue.trim() ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      
      {/* Styles for Pulse Glow & Animation */}
      <style>{`
        .pulse-glow {
          animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(79, 70, 229, 0); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .hover-scale:hover {
          transform: scale(1.06);
        }
        .fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .quick-reply-btn:hover {
          background: rgba(79, 70, 229, 0.12) !important;
          transform: translateY(-1px);
        }
        .chat-input:focus {
          border-color: #4f46e5 !important;
        }
        .typing-dots .dot {
          width: 6px;
          height: 6px;
          background: #4f46e5;
          border-radius: 50%;
          animation: typingDot 1.4s infinite both;
        }
        .typing-dots .dot:nth-child(2) {
          animation-delay: .2s;
        }
        .typing-dots .dot:nth-child(3) {
          animation-delay: .4s;
        }
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .pulse {
          animation: pulseIndicator 1.5s infinite;
        }
        @keyframes pulseIndicator {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
