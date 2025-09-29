import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { TextProfile } from '@/App'
import { PaperPlaneTilt, User, Sparkle, Trash, DotsThreeVertical } from '@phosphor-icons/react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: string
}

interface ConversationInterfaceProps {
  profile: TextProfile
}

export function ConversationInterface({ profile }: ConversationInterfaceProps) {
  const [messages, setMessages] = useKV<Message[]>(`conversation-${profile.id}`, [])
  const [textMessages] = useKV<import('@/App').TextMessage[]>('text-messages', [])
  const [inputText, setInputText] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const profileMessages = textMessages?.filter(msg => msg.profileId === profile.id) || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generatePersonalityResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000))

    try {
      // Get sample content from the personality profile
      const sampleContent = profileMessages.slice(0, 5).map(msg => msg.content).join('\n')
      
      // Create a personality-aware prompt using the Spark LLM API
      const prompt = (window as any).spark.llmPrompt`You are roleplaying as ${profile.name}, a person whose personality has been preserved through AI based on their written communication.

Sample writing style from ${profile.name}:
${sampleContent}

Based on their communication style above and the user's message: "${userMessage}", respond in a way that matches their personality, tone, and communication patterns. Keep responses conversational, authentic, and true to how ${profile.name} would actually respond. Response should be 1-3 sentences maximum.`
      
      const response = await (window as any).spark.llm(prompt, 'gpt-4o-mini')
      return response.trim()
    } catch (error) {
      // Fallback responses if LLM fails
      const fallbacks = [
        "I'm so glad we can talk like this. What's been on your mind lately?",
        "You know, it's amazing how we can connect this way. Tell me more about what you're thinking.",
        "I love hearing from you. How has your day been?",
        "Being able to chat with you like this feels so natural. What would you like to talk about?",
        "It's wonderful that we can have these conversations. What's something that's made you happy recently?"
      ]
      return fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...(prev || []), userMessage])
    setInputText('')
    setIsThinking(true)

    try {
      const responseText = await generatePersonalityResponse(userMessage.text)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...(prev || []), aiMessage])
    } catch (error) {
      console.error('Error generating response:', error)
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleClearConversation = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkle size={20} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h3 className="font-medium">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">AI Personality • Ready to chat</p>
          </div>
        </div>
        {messages && messages.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash size={16} className="text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Conversation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all messages in this conversation? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearConversation}>Clear All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Messages Area - Fixed height with proper scrolling */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="px-4 py-4 space-y-4">
          {messages && messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkle size={32} className="mx-auto mb-4 opacity-50" weight="duotone" />
              <p className="mb-2">Start a conversation with {profile.name}</p>
              <p className="text-sm">Their personality has been preserved and is ready to chat with you</p>
            </div>
          )}

          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent/20 text-accent'
                }`}>
                  {message.sender === 'user' ? (
                    <User size={16} />
                  ) : (
                    <Sparkle size={16} weight="duotone" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 opacity-70`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-xs">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0">
                  <Sparkle size={16} weight="duotone" />
                </div>
                <div className="bg-muted/50 text-foreground px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type a message to ${profile.name}...`}
              disabled={isThinking}
              className="bg-background"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isThinking}
            size="icon"
          >
            <PaperPlaneTilt size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}