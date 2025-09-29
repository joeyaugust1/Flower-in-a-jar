import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, User, Trash, Heart } from '@phosphor-icons/react'
import { TextProfile } from '@/App'

interface ProfileManagerProps {
  selectedProfile: string | null
  onSelectProfile: (profileId: string) => void
}

export function ProfileManager({ selectedProfile, onSelectProfile }: ProfileManagerProps) {
  const [profiles, setProfiles] = useKV<TextProfile[]>('text-profiles', [])
  const [, setTextMessages] = useKV<import('@/App').TextMessage[]>('text-messages', [])
  const [newProfileName, setNewProfileName] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateProfile = () => {
    if (!newProfileName.trim() || !consentGiven) return

    const newProfile: TextProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      messageCount: 0,
      totalWordCount: 0,
      isReady: false,
      createdAt: new Date().toISOString(),
      consentGiven: true
    }

    setProfiles((current) => [...(current || []), newProfile])
    setNewProfileName('')
    setConsentGiven(false)
    setIsCreating(false)
    onSelectProfile(newProfile.id)
  }

  const handleDeleteProfile = async (profileId: string) => {
    // Delete the profile
    setProfiles((current) => (current || []).filter(p => p.id !== profileId))
    
    // Delete all text messages for this profile
    setTextMessages((current) => (current || []).filter(msg => msg.profileId !== profileId))
    
    // Delete conversation history for this profile
    try {
      if (window.spark?.kv?.delete) {
        await window.spark.kv.delete(`conversation-${profileId}`)
      }
    } catch (error) {
      console.warn('Failed to delete conversation history:', error)
    }
    
    if (selectedProfile === profileId) {
      onSelectProfile('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Profile Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <Plus className="mr-2" size={20} />
            Create New Text Profile
          </Button>
        </DialogTrigger>
        <DialogContent className="memory-card">
          <DialogHeader>
            <DialogTitle>Create Text Profile</DialogTitle>
            <DialogDescription>
              Set up a new personality profile for text-based personality preservation. Ensure you have explicit consent from the person.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="profile-name">Person's Name</Label>
              <Input
                id="profile-name"
                placeholder="Enter their name..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-start space-x-2 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Consent Confirmation
                </Label>
                <p className="text-xs text-muted-foreground">
                  I confirm that the person whose personality will be preserved has given explicit consent 
                  for their written communication style and personality to be cloned using this application.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleCreateProfile} 
              disabled={!newProfileName.trim() || !consentGiven}
              className="w-full"
            >
              Create Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Profiles */}
      {profiles && profiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className={`group cursor-pointer transition-all duration-200 hover:organic-shadow ${
                selectedProfile === profile.id 
                  ? 'ring-2 ring-primary gentle-glow' 
                  : 'hover:ring-1 hover:ring-border'
              }`}
              onClick={() => onSelectProfile(profile.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={24} className="text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{profile.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(profile.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash size={16} className="text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {profile.name}'s profile? This will permanently remove:
                          <br />• The personality profile
                          <br />• All uploaded text content ({profile.messageCount} items)
                          <br />• All conversation history
                          <br /><br />This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Profile
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Content Items:</span>
                    <span>{profile.messageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Words:</span>
                    <span>{profile.totalWordCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className={profile.isReady ? 'text-green-600' : 'text-amber-600'}>
                      {profile.isReady ? 'Ready for chat' : 'Training...'}
                    </span>
                    {profile.isReady && <Heart className="text-primary" size={16} weight="fill" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {profiles && profiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <User size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No text profiles yet</h3>
          <p>Create your first profile to begin preserving precious personalities</p>
        </div>
      )}
    </div>
  )
}