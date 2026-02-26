import { Card, CardContent, CardHeader } from '@/components/ui/card'

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 bg-secondary rounded animate-pulse w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="h-4 bg-secondary rounded animate-pulse w-1/3" />
      </CardContent>
    </Card>
  )
}

export default function DashboardLoading() {
  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4 pt-8">
      <div className="h-6 bg-secondary rounded animate-pulse w-32" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </main>
  )
}
