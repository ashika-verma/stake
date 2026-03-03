'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateProfile } from '@/actions/auth'

const schema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50),
  venmoUsername: z.string()
    .transform(v => v.replace(/^@/, '').trim())
    .refine(v => v === '' || /^[a-zA-Z0-9_-]{1,30}$/.test(v), 'Venmo usernames are letters, numbers, _ and - only.')
    .optional(),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  displayName: string
  venmoUsername: string | null
}

export function ProfileForm({ displayName, venmoUsername }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName,
      venmoUsername: venmoUsername ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const result = await updateProfile({
      displayName: values.displayName,
      venmoUsername: values.venmoUsername || undefined,
    })
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Profile updated')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" {...register('displayName')} placeholder="Your name" />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="venmoUsername">
              Venmo username
              <span className="ml-1.5 text-muted-foreground font-normal text-xs">(required for betting)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
              <Input
                id="venmoUsername"
                {...register('venmoUsername')}
                placeholder="yourname"
                className="pl-7"
              />
            </div>
            {errors.venmoUsername && (
              <p className="text-sm text-destructive">{errors.venmoUsername.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used to generate payment links when settling bets.
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
