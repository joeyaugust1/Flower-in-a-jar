import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { VoiceProfile, VoiceRecording } from '@/App'
import { TextMessage } from '@/components/VoiceUpload'
import { FileAudio, Clock, CheckCircle, Heart, Waveform, Sparkle, ChatText } from '@phosphor-icons/react'

interface DashboardProps {
  profile: VoiceProfile
}

export function Dashboard({ profile }: DashboardProps) {
  const [recordings] = useKV<VoiceRecording[]>('voice-recordings', [])
  const [textMessages] = useKV<TextMessage[]>('text-messages', [])
  
  const profileRecordings = recordings?.filter(r => r.profileId === profile.id) || []
  const profileTextMessages = textMessages?.filter(t => t.profileId === profile.id) || []
  const totalTextDuration = profileTextMessages.reduce((sum, msg) => sum + msg.estimatedDuration, 0)
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTrainingStage = () => {
    if (profile.recordingCount === 0) return 'No recordings yet'
    if (profile.recordingCount < 3) return 'Collecting voice samples'
    if (profile.recordingCount < 5) return 'Analyzing speech patterns'
    if (profile.recordingCount < 8) return 'Building personality model'
    return 'Optimizing responses'
  }

  const getProgressPercentage = () => {
    if (profile.isReady) return 100
    return Math.min((profile.recordingCount / 3) * 100, 100)
  }

  const getQualityMetrics = () => {
    const avgDuration = profile.recordingCount > 0 ? profile.totalDuration / profile.recordingCount : 0
    const qualityScore = Math.min(
      (avgDuration / 120) * 30 + // Duration factor (up to 30 points)
      (profile.recordingCount / 10) * 70, // Recording count factor (up to 70 points)
      100
    )
    
    return Math.round(qualityScore)
  }

  return (
    <div className="space-y-6">
      {/* Training Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="memory-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileAudio size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{Math.floor(profile.recordingCount)}</p>
                <p className="text-muted-foreground text-sm">Voice Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="memory-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <ChatText size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{profileTextMessages.length}</p>
                <p className="text-muted-foreground text-sm">Text Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="memory-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{formatDuration(profile.totalDuration)}</p>
                <p className="text-muted-foreground text-sm">Total Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="memory-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Sparkle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{getQualityMetrics()}%</p>
                <p className="text-muted-foreground text-sm">Quality Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Progress */}
      <Card className="memory-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waveform className="text-primary" size={24} />
            Training Progress
          </CardTitle>
          <CardDescription>
            Current stage: {getTrainingStage()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
            
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                {profile.isReady ? (
                  <>
                    <CheckCircle size={20} className="text-green-600" weight="fill" />
                    <span className="text-green-600 font-medium">Ready for conversations!</span>
                  </>
                ) : (
                  <>
                    <Heart size={20} className="text-primary" weight="duotone" />
                    <span className="text-muted-foreground">
                      {3 - profile.recordingCount} more recordings needed
                    </span>
                  </>
                )}
              </div>
              <Badge variant={profile.isReady ? "default" : "secondary"}>
                {profile.isReady ? "Complete" : "In Progress"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Recordings and Text Messages */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="memory-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio size={20} className="text-primary" />
              Recent Recordings
            </CardTitle>
            <CardDescription>
              Your latest uploaded voice samples
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileRecordings.length > 0 ? (
              <div className="space-y-3">
                {profileRecordings
                  .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                  .slice(0, 3)
                  .map((recording) => (
                    <div key={recording.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileAudio size={16} className="text-primary" />
                        <div>
                          <p className="font-medium text-sm truncate max-w-xs">{recording.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(recording.uploadedAt)} • {formatDuration(recording.duration)}
                          </p>
                        </div>
                      </div>
                      <CheckCircle size={16} className="text-green-600" weight="fill" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileAudio size={32} className="mx-auto mb-2 opacity-50" />
                <p>No recordings uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="memory-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChatText size={20} className="text-accent" />
              Recent Text Messages
            </CardTitle>
            <CardDescription>
              Your latest text training data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileTextMessages.length > 0 ? (
              <div className="space-y-3">
                {profileTextMessages
                  .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                  .slice(0, 3)
                  .map((message) => (
                    <div key={message.id} className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm line-clamp-2 mb-1">{message.content}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatDate(message.uploadedAt)}</span>
                        <span>{formatDuration(message.estimatedDuration)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ChatText size={32} className="mx-auto mb-2 opacity-50" />
                <p>No text messages uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Milestones */}
      <Card className="memory-card">
        <CardHeader>
          <CardTitle>Training Milestones</CardTitle>
          <CardDescription>
            Track your progress through the voice cloning process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { milestone: 'First Recording', recordings: 1, description: 'Initial voice sample captured' },
              { milestone: 'Basic Training', recordings: 3, description: 'Minimum data for conversation' },
              { milestone: 'Enhanced Quality', recordings: 5, description: 'Improved naturalness and accuracy' },
              { milestone: 'Personality Depth', recordings: 8, description: 'Rich emotional expression' },
              { milestone: 'Master Clone', recordings: 12, description: 'Highest fidelity reproduction' }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  profile.recordingCount >= item.recordings 
                    ? 'bg-green-100 text-green-700' 
                    : profile.recordingCount >= item.recordings - 1
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {profile.recordingCount >= item.recordings ? '✓' : item.recordings}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    profile.recordingCount >= item.recordings ? 'text-green-700' : ''
                  }`}>
                    {item.milestone}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}