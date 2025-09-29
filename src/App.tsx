import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileManager } from '@/components/ProfileManager'
import { TextUpload } from '@/components/TextUpload'
import { ConversationInterface } from '@/components/ConversationInterface'
import { Sparkle, User, Upload } from '@phosphor-icons/react'

export interface TextProfile {
  id: string
  name: string
  messageCount: number
  totalWordCount: number
  isReady: boolean
  createdAt: string
  consentGiven: boolean
}

export interface TextMessage {
  id: string
  profileId: string
  content: string
  wordCount: number
  timestamp: string
  uploadedAt: string
  processed: boolean
}

export default function App() {
  const [profiles] = useKV<TextProfile[]>('text-profiles', [])
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profiles')

  const currentProfile = profiles?.find(p => p.id === selectedProfile)

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfile(profileId)
    setActiveTab('upload')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkle size={24} className="text-primary" weight="duotone" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground">Flower in a Jar</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Preserve personalities through written words and have meaningful conversations with AI companions trained on authentic communication.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <User size={18} />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2" disabled={!selectedProfile}>
              <Upload size={18} />
              Upload
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2" disabled={!currentProfile?.isReady}>
              <Sparkle size={18} />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <Card className="organic-shadow">
              <CardHeader>
                <CardTitle>Personality Profiles</CardTitle>
                <CardDescription>
                  Create and manage personality profiles built from written communication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileManager 
                  selectedProfile={selectedProfile}
                  onSelectProfile={handleSelectProfile}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="organic-shadow">
              <CardHeader>
                <CardTitle>Upload Text Content</CardTitle>
                <CardDescription>
                  {currentProfile ? `Upload text to build ${currentProfile.name}'s personality` : 'Select a profile to begin uploading'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedProfile && (
                  <TextUpload profileId={selectedProfile} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            {currentProfile && (
              <div className="h-[600px]">
                <Card className="organic-shadow h-full flex flex-col">
                  <ConversationInterface profile={currentProfile} />
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}