import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChatText, Plus, FileText, Upload, Image, Camera, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { TextProfile, TextMessage } from '@/App'
import { extractTextFromImage } from '@/lib/ocr'

interface TextUploadProps {
  profileId: string
}

export function TextUpload({ profileId }: TextUploadProps) {
  const [profiles, setProfiles] = useKV<TextProfile[]>('text-profiles', [])
  const [textMessages, setTextMessages] = useKV<TextMessage[]>('text-messages', [])
  const [textContent, setTextContent] = useState('')
  const [isSubmittingText, setIsSubmittingText] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [chatBubblePosition, setChatBubblePosition] = useState<'left' | 'right'>('left')
  const [extractedText, setExtractedText] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profile = profiles?.find(p => p.id === profileId)
  const profileTextMessages = textMessages?.filter(t => t.profileId === profileId) || []

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return
    
    setIsSubmittingText(true)
    
    try {
      // Count words for progress tracking
      const wordCount = textContent.trim().split(/\s+/).length
      
      const newTextMessage: TextMessage = {
        id: Date.now().toString(),
        profileId,
        content: textContent.trim(),
        wordCount,
        timestamp: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        processed: true
      }
      
      setTextMessages(prev => [...(prev || []), newTextMessage])
      
      // Update profile stats - ready after 500 words total
      const currentTotalWords = profileTextMessages.reduce((sum, msg) => sum + msg.wordCount, 0)
      const newTotalWords = currentTotalWords + wordCount
      
      setProfiles(prev => 
        (prev || []).map(p =>
          p.id === profileId
            ? {
                ...p,
                messageCount: p.messageCount + 1,
                totalWordCount: newTotalWords,
                isReady: newTotalWords >= 500 // Ready after 500+ words
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('Image file is too large. Please choose a file smaller than 10MB.')
      return
    }

    setSelectedImage(file)
    setIsProcessingImage(true)
    setExtractedText('')
    setOcrProgress(0)
    
    try {
      // Use the OCR utility for text extraction with position filtering
      const extractedContent = await extractTextFromImage(file, {
        onProgress: (progress) => setOcrProgress(progress),
        language: 'eng',
        bubblePosition: chatBubblePosition
      })
      
      if (extractedContent && extractedContent.trim()) {
        if (extractedContent.trim().length > 10) {
          setExtractedText(extractedContent)
          setTextContent(prev => prev ? prev + '\n\n' + extractedContent : extractedContent)
          
          // Clear the selected image after successful processing
          setSelectedImage(null)
          if (imageInputRef.current) imageInputRef.current.value = ''
          
          // Count extracted words for feedback
          const wordCount = extractedContent.trim().split(/\s+/).length
          
          // Show success message briefly
          setTimeout(() => {
            alert(`✅ OCR Success!\n\nExtracted ${wordCount} words from ${chatBubblePosition} side chat bubbles.\n\nThe text has been added to the input area below - you can review and edit it before adding to the personality.`)
          }, 500)
        } else {
          alert(`⚠️ Limited Text Found\n\nOnly found "${extractedContent.trim()}" from the ${chatBubblePosition} side.\n\n💡 Suggestions:\n• Check that the correct side is selected (left vs right bubbles)\n• Try a clearer image with better contrast\n• Ensure the screenshot contains readable message text\n• Try cropping closer to the conversation area`)
        }
      } else {
        alert(`❌ No Text Detected\n\nCouldn't extract any text from the ${chatBubblePosition} side of the image.\n\n🔧 Troubleshooting:\n• Verify the correct bubble side is selected\n• Ensure image has good lighting and contrast\n• Try a different screenshot with clearer text\n• Check that the image contains actual conversation messages\n• Consider using a PNG format for better quality`)
      }
    } catch (error) {
      console.error('OCR Error:', error)
      let errorMessage = '❌ OCR Processing Failed'
      let suggestions = '💡 Try these solutions:\n• Use a clearer image with better lighting\n• Ensure text has good contrast with background\n• Try a different image format (PNG recommended)\n• Reduce image size if very large\n• Check your internet connection'
      
      if (error instanceof Error) {
        if (error.message.includes('OCR failed')) {
          errorMessage = '🔍 Text Recognition Failed'
          suggestions = `💡 OCR couldn't read the text:\n• Check that the ${chatBubblePosition} side has readable text\n• Try increasing image brightness/contrast\n• Crop image closer to the conversation\n• Use screenshots with larger text size\n• Ensure bubbles aren't cut off`
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '🌐 Network Connection Error'
          suggestions = '💡 Connection issues:\n• Check your internet connection\n• Try again in a few moments\n• If problem persists, try a smaller image'
        } else {
          errorMessage = `⚠️ Processing Error: ${error.message}`
        }
      }
      
      alert(`${errorMessage}\n\n${suggestions}`)
      
      // Clear the selected image on error
      setSelectedImage(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
    } finally {
      setIsProcessingImage(false)
      setOcrProgress(0)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setTextContent(content)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Screenshot Upload Area */}
      <Card className="memory-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Camera size={32} className="text-primary" weight="duotone" />
            <div>
              <h3 className="text-lg font-medium">Upload Chat Screenshots</h3>
              <p className="text-muted-foreground">
                Upload screenshots from messaging apps to extract text conversations using OCR technology
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Chat Bubble Position Selection */}
            <div className="space-y-2">
              <Label htmlFor="bubble-position">Which chat bubbles to extract text from?</Label>
              <Select value={chatBubblePosition} onValueChange={(value: 'left' | 'right') => setChatBubblePosition(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">
                    <div className="flex items-center gap-2">
                      <ArrowLeft size={16} />
                      Left side bubbles (other person - typically white/gray background)
                    </div>
                  </SelectItem>
                  <SelectItem value="right">
                    <div className="flex items-center gap-2">
                      <ArrowRight size={16} />
                      Right side bubbles (your messages - typically blue/colored background)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 p-3 rounded-lg">
                <p><strong>📱 How OCR Filtering Works:</strong></p>
                <p>• Our advanced OCR technology first reads <em>all</em> text from your screenshot</p>
                <p>• Then applies spatial filtering to extract only text from the {chatBubblePosition} side of the conversation</p>
                <p>• Finally, it cleans up the text by removing timestamps, usernames, and UI elements</p>
                <br />
                <p><strong>🎯 Best Results Tips:</strong></p>
                <p>• Use clear, well-lit screenshots with good contrast between text and background</p>
                <p>• Crop screenshots to focus on the conversation area (remove status bars, keyboards)</p>
                <p>• For Messenger: "Left" = white bubbles (other person), "Right" = blue bubbles (you)</p>
                <p>• For WhatsApp: "Left" = light gray bubbles (other person), "Right" = green bubbles (you)</p>
                <p>• Multiple screenshots work better than very long conversations in one image</p>
              </div>
            </div>

            {/* Image Upload */}
            <div className="flex items-center gap-4 p-4 border border-dashed border-border rounded-lg">
              <Image size={24} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Upload Screenshot</p>
                <p className="text-sm text-muted-foreground">
                  Screenshots from Messenger, WhatsApp, iMessage, or other chat apps
                </p>
                {selectedImage && !isProcessingImage && (
                  <p className="text-xs text-primary mt-1">
                    Selected: {selectedImage.name} - Click "Choose Image" again to process a different image
                  </p>
                )}
                {isProcessingImage && (
                  <p className="text-xs text-accent mt-1">
                    Processing {selectedImage?.name} with OCR...
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (imageInputRef.current) {
                    imageInputRef.current.value = '' // Clear previous selection
                    imageInputRef.current.click()
                  }
                }}
                className="flex items-center gap-2"
                disabled={isProcessingImage}
              >
                <Camera size={16} />
                {isProcessingImage ? 'Processing...' : selectedImage ? 'Change Image' : 'Choose Image'}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Processing indicator */}
            {isProcessingImage && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"></div>
                  <div>
                    <p className="font-medium text-primary">Processing Image with OCR...</p>
                    <p className="text-sm text-muted-foreground">
                      Extracting text using advanced optical character recognition
                    </p>
                  </div>
                </div>
                {ocrProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{ocrProgress}%</span>
                    </div>
                    <Progress value={ocrProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}

            {/* Show extracted text preview */}
            {extractedText && !isProcessingImage && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Extracted Text Preview:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{extractedText}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This text will be added to the training data. You can edit it below before submitting.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Text Upload Area */}
      <Card className="memory-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ChatText size={32} className="text-primary" weight="duotone" />
            <div>
              <h3 className="text-lg font-medium">Add Written Content</h3>
              <p className="text-muted-foreground">
                Upload text files or manually enter text content to build the personality
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* File Upload Option */}
            <div className="flex items-center gap-4 p-4 border border-dashed border-border rounded-lg">
              <FileText size={24} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Upload Text File</p>
                <p className="text-sm text-muted-foreground">
                  Import from .txt files, chat exports, or other text documents
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click()
                  }
                }}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                Browse
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Manual Text Input */}
            <div>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste or type written content here... Messages, emails, letters, social media posts, or any text that shows this person's communication style and personality. The more authentic and varied the content, the better the AI will capture their personality."
                className="min-h-[300px]"
                disabled={isSubmittingText}
              />
              
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {textContent.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </p>
                <Button 
                  onClick={handleTextSubmit}
                  disabled={!textContent.trim() || isSubmittingText}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  {isSubmittingText ? 'Adding...' : 'Add Content'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Text Messages */}
      {profileTextMessages.length > 0 && (
        <Card className="memory-card">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Recent Content ({profileTextMessages.length} items)</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {profileTextMessages.slice(-5).reverse().map((message) => (
                <div key={message.id} className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm line-clamp-2 mb-2">{message.content}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{new Date(message.uploadedAt).toLocaleDateString()}</span>
                    <span>{message.wordCount} words</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidelines */}
      <Alert>
        <ChatText className="h-4 w-4" />
        <AlertDescription>
          <strong>Best Results:</strong> Upload conversation screenshots to quickly capture authentic dialogue using OCR technology, 
          or include diverse text content like casual messages, formal emails, social media posts, letters, or 
          journal entries. For screenshots, ensure clear, readable text with good contrast. 
          Varied communication styles help create a more well-rounded personality. Aim for at least 500 words total.
        </AlertDescription>
      </Alert>

      {/* Current Profile Stats */}
      {profile && (
        <Card className="memory-card">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Training Progress for {profile.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground">Content Items:</span>
                <span className="ml-2 font-medium">{profile.messageCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Words:</span>
                <span className="ml-2 font-medium">{profile.totalWordCount.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Training Progress</span>
                <span>{profile.isReady ? 'Ready!' : `${Math.min(Math.floor((profile.totalWordCount / 500) * 100), 100)}%`}</span>
              </div>
              <Progress 
                value={profile.isReady ? 100 : Math.min((profile.totalWordCount / 500) * 100, 100)} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {profile.isReady 
                  ? 'Personality is ready for conversations! Add more content to improve accuracy.'
                  : `Add ${Math.max(0, 500 - profile.totalWordCount)} more words to enable conversations`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}