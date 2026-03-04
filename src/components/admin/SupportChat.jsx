import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaUser,
  FaHeadset,
  FaPaperPlane,
  FaPaperclip,
  FaSmile,
  FaCheck,
  FaCheckDouble,
  FaUserCheck,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SupportChat = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket, joinConversation, sendMessage } = useSocket();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: conversationsData } = useQuery({
    queryKey: ['supportConversations'],
    queryFn: () => adminAPI.getSupportConversations({ status: 'active' }),
    refetchInterval: 10000,
  });

  // ✅ استخراج المحادثات بشكل آمن
  const conversations = conversationsData?.data?.data || [];

  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation.id);
      
      socket?.on('new-message', (message) => {
        if (message.conversationId === selectedConversation.id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      return () => {
        socket?.off('new-message');
      };
    }
  }, [selectedConversation, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages || []);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const messageData = {
      content: messageInput,
      type: 'text',
      conversationId: selectedConversation.id,
    };

    try {
      sendMessage(selectedConversation.id, messageData);
      setMessageInput('');
      
      const tempMessage = {
        id: Date.now(),
        ...messageData,
        sender: user,
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages(prev => [...prev, tempMessage]);
    } catch (error) {
      toast.error(t('failed_to_send_message'));
    }
  };

  const handleAssignToMe = async (conversation) => {
    try {
      await adminAPI.assignSupportConversation(conversation.id, user.id);
      toast.success(t('conversation_assigned'));
      queryClient.invalidateQueries(['supportConversations']);
    } catch (error) {
      toast.error(t('failed_to_assign'));
    }
  };

  return (
    <div className="support-chat">
      <div className="chat-header">
        <h1>{t('support_chat')}</h1>
      </div>

      <div className="chat-container">
        <div className="conversations-sidebar">
          <h3>{t('active_conversations')}</h3>
          <div className="conversations-list">
            {conversations.map((conv) => {
              const client = conv.participants?.find(p => p.role === 'client');
              
              return (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conversation-avatar">
                    {client?.avatar ? (
                      <img src={client.avatar} alt={client.name} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="conversation-info">
                    <h4>{client?.name || t('anonymous')}</h4>
                    <p className="last-message">
                      {conv.lastMessage?.content || t('no_messages')}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                  {!conv.assignedTo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignToMe(conv);
                      }}
                      className="btn-icon assign"
                      title={t('assign_to_me')}
                    >
                      <FaUserCheck />
                    </button>
                  )}
                </div>
              );
            })}
            {conversations.length === 0 && (
              <p className="text-center">{t('no_conversations')}</p>
            )}
          </div>
        </div>

        <div className="chat-area">
          {selectedConversation ? (
            <>
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`message ${message.sender?.id === user.id ? 'sent' : 'received'}`}
                  >
                    {message.sender?.id !== user.id && (
                      <div className="message-avatar">
                        <img 
                          src={message.sender?.image || '/default-avatar.png'} 
                          alt={message.sender?.name} 
                        />
                      </div>
                    )}
                    <div className="message-content">
                      <div className="message-bubble">
                        {message.type === 'text' && <p>{message.content}</p>}
                        {message.type === 'file' && (
                          <a href={message.content} target="_blank" rel="noopener noreferrer">
                            {message.fileName || t('view_file')}
                          </a>
                        )}
                      </div>
                      <div className="message-meta">
                        <span className="message-time">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.sender?.id === user.id && (
                          <span className="message-status">
                            {message.status === 'sent' && <FaCheck />}
                            {message.status === 'delivered' && <FaCheckDouble />}
                            {message.status === 'read' && (
                              <FaCheckDouble className="read" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
                <div className="input-actions">
                  <button className="btn-icon">
                    <FaSmile />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-icon"
                  >
                    <FaPaperclip />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder={t('type_message')}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="form-control"
                />
                <button
                  onClick={handleSendMessage}
                  className="btn btn-primary send-btn"
                  disabled={!messageInput.trim()}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <FaHeadset className="icon" />
              <h3>{t('select_conversation')}</h3>
              <p>{t('select_conversation_to_start')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportChat;