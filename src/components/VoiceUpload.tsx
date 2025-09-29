import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CloudArrowUp, FileAudio, X, CheckCircle, Warning, ChatText, Plus } from '@phosphor-icons/react'
import { VoiceProfile, VoiceRecording } from '@/App'

export interface TextMessage {
  id: string
  profileId: string
  content: string
  estimatedDuration: number
  uploadedAt: string
  processed: boolean
}

interface VoiceUploadProps {
  profileId: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

export function VoiceUpload({ profileId }: VoiceUploadProps) {
  const [profiles, setProfiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [recordings, setRecordings] = useKV<VoiceRecording[]>('voice-recordings', [])
  const [textMessages, setTextMessages] = useKV<TextMessage[]>('text-messages', [])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [isSubmittingText, setIsSubmittingText] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profile = profiles?.find(p => p.id === profileId)
  const profileTextMessages = textMessages?.filter(t => t.profileId === profileId) || []
  const totalTextDuration = profileTextMessages.reduce((sum, msg) => sum + msg.estimatedDuration, 0)
  
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('audio/') || 
                         file.name.toLowerCase().endsWith('.mp3') ||
                         file.name.toLowerCase().endsWith('.wav') ||
                         file.name.toLowerCase().endsWith('.m4a')
      return isValidType
    })

    validFiles.forEach(file => {
      const uploadingFile: UploadingFile = {
        id: Date.now().toString() + Math.random(),
        file,
        progress: 0,
        status: 'uploading'
      }
      
      setUploadingFiles(prev => [...prev, uploadingFile])
      simulateUpload(uploadingFile)
    })
  }

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return
    
    setIsSubmittingText(true)
    
    try {
      // Estimate reading time (average 200 words per minute)
      const wordCount = textContent.trim().split(/\s+/).length
      const estimatedDuration = Math.max(Math.ceil((wordCount / 200) * 60), 10) // Minimum 10 seconds
      
      const newTextMessage: TextMessage = {
        id: Date.now().toString(),
        profileId,
        content: textContent.trim(),
        estimatedDuration,
        uploadedAt: new Date().toISOString(),
        processed: true
      }
      
      setTextMessages(prev => [...(prev || []), newTextMessage])
      
      // Update profile stats - text messages count as 50% of voice recordings for training
      setProfiles(prev => 
        (prev || []).map(p =>
          p.id === profileId
            ? {
                ...p,
                recordingCount: p.recordingCount + 0.5,
                totalDuration: p.totalDuration + estimatedDuration,
                isReady: (p.recordingCount + 0.5) >= 2
              }
            : p
        )
      )
      
      setTextContent('')
      
    } catch (error) {
      console.error('Error submitting text:', error)
    } finally {
      setIsSubmittingText(false)
    }
  }

  const simulateUpload = async (uploadingFile: UploadingFile) => {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === uploadingFile.id
            ? { ...f, progress: Math.min(f.progress + Math.random() * 20, 95) }
            : f
        )
      )
    }, 200)

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
    
    clearInterval(progressInterval)

    // Simulate processing
    setUploadingFiles(prev =>
      prev.map(f =>
        f.id === uploadingFile.id
          ? { ...f, progress: 100, status: 'processing' }
          : f
      )
    )

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Complete upload
    const duration = Math.floor(Math.random() * 300) + 60 // Random duration between 1-6 minutes

    const newRecording: VoiceRecording = {
      id: uploadingFile.id,
      profileId,
      filename: uploadingFile.file.name,
      duration,
      uploadedAt: new Date().toISOString(),
      processed: true
    }

    setRecordings(prev => [...(prev || []), newRecording])

    // Update profile stats
    setProfiles(prev => 
      (prev || []).map(p =>
        p.id === profileId
          ? {
              ...p,
              recordingCount: p.recordingCount + 1,
              totalDuration: p.totalDuration + duration,
              isReady: p.recordingCount >= 2 // Ready after 3 recordings
            }
          : p
      )
    )

    setUploadingFiles(prev =>
      prev.map(f =>
        f.id === uploadingFile.id
          ? { ...f, status: 'complete' }
          : f
      )
    )

    // Remove completed file after a delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id))
    }, 3000)
  }

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Upload Method Tabs */}
      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <FileAudio size={16} />
            Voice Recordings
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <ChatText size={16} />
            Text Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-6 mt-6">
          {/* Voice Upload Area */}
          <Card
            className={`relative border-2 border-dashed transition-all duration-200 ${
              isDragging 
                ? 'border-primary bg-primary/5 gentle-glow' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFileSelect(e.dataTransfer.files)
            }}
          >
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CloudArrowUp size={64} className="text-primary mb-4" weight="duotone" />
              <h3 className="text-lg font-medium mb-2">
                Drop audio files here or click to browse
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                Supported formats: MP3, WAV, M4A • No file size limit • Unlimited duration
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8"
              >
                Choose Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.m4a"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Voice Upload Guidelines */}
          <Alert>
            <FileAudio className="h-4 w-4" />
            <AlertDescription>
              <strong>Best Results:</strong> Upload clear recordings with minimal background noise. 
              Longer conversations and varied emotional expressions help create a more authentic personality clone. 
              We recommend at least 30 minutes of total audio for optimal results.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="text" className="space-y-6 mt-6">
          {/* Text Upload Area */}
          <Card className="memory-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ChatText size={32} className="text-primary" weight="duotone" />
                <div>
                  <h3 className="text-lg font-medium">Add Text Messages</h3>
                  <p className="text-muted-foreground">
                    Add written content to help train the personality (chat logs, emails, letters, etc.)
                  </p>
                </div>
              </div>
              
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste text messages, chat logs, emails, or any written content from this person. The more natural and conversational the better for personality training..."
                className="min-h-[200px] mb-4"
                disabled={isSubmittingText}
              />
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {textContent.trim().split(/\s+/).length} words • 
                  ~{Math.max(Math.ceil((textContent.trim().split(/\s+/).length / 200) * 60), 10)} seconds estimated reading time
                </p>
                <Button 
                  onClick={handleTextSubmit}
                  disabled={!textContent.trim() || isSubmittingText}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  {isSubmittingText ? 'Adding...' : 'Add Text'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Text Messages */}
          {profileTextMessages.length > 0 && (
            <Card className="memory-card">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Recent Text Additions</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {profileTextMessages.slice(-5).reverse().map((message) => (
                    <div key={message.id} className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm line-clamp-2">{message.content}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{new Date(message.uploadedAt).toLocaleDateString()}</span>
                        <span>{formatDuration(message.estimatedDuration)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Text Upload Guidelines */}
          <Alert>
            <ChatText className="h-4 w-4" />
            <AlertDescription>
              <strong>Best Results:</strong> Include natural conversations, personal messages, or any text that shows this person's communication style. 
              Varied content types (casual chats, formal emails, creative writing) help create a more well-rounded personality.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploading Files</h4>
          {uploadingFiles.map((file) => (
            <Card key={file.id} className="memory-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <FileAudio size={24} className="text-primary" />
                    <div>
                      <p className="font-medium truncate max-w-xs">{file.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'complete' && (
                      <CheckCircle size={20} className="text-green-600" weight="fill" />
                    )}
                    {file.status === 'error' && (
                      <Warning size={20} className="text-destructive" weight="fill" />
                    )}
                    {file.status !== 'complete' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(file.id)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {file.status === 'uploading' && 'Uploading...'}
                      {file.status === 'processing' && 'Processing...'}
                      {file.status === 'complete' && 'Complete!'}
                      {file.status === 'error' && 'Error'}
                    </span>
                    {file.status !== 'error' && <span>{Math.round(file.progress)}%</span>}
                  </div>
                  <Progress value={file.progress} className="h-2" />
                  {file.error && (
                    <p className="text-sm text-destructive">{file.error}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Current Profile Stats */}
      {profile && (
        <Card className="memory-card">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Current Progress for {profile.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Voice Recordings:</span>
                <span className="ml-2 font-medium">{Math.floor(profile.recordingCount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Text Messages:</span>
                <span className="ml-2 font-medium">{profileTextMessages.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Voice Duration:</span>
                <span className="ml-2 font-medium">{formatDuration(profile.totalDuration - totalTextDuration)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Text Duration:</span>
                <span className="ml-2 font-medium">{formatDuration(totalTextDuration)}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Training Progress</span>
                <span>{profile.isReady ? 'Ready!' : `${Math.min(Math.floor(profile.recordingCount * 50), 100)}%`}</span>
              </div>
              <Progress value={profile.isReady ? 100 : profile.recordingCount * 50} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {profile.isReady 
                  ? 'Your personality clone is ready for conversations!'
                  : `Upload ${Math.max(0, Math.ceil(2 - profile.recordingCount))} more voice recordings or text content to enable conversations`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}