import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateGroupForm } from '@/components/groups/CreateGroupForm'

export default function NewGroupPage() {
  return (
    <main className="max-w-md mx-auto p-4 pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a group</CardTitle>
          <CardDescription>Start a betting group for your friends</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>
    </main>
  )
}
