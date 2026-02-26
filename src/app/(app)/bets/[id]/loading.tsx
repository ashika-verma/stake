import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function BetLoading() {
  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6 pt-4">
      <div className="h-4 bg-secondary rounded animate-pulse w-40" />
      <Card>
        <CardHeader>
          <div className="h-7 bg-secondary rounded animate-pulse w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 bg-secondary rounded animate-pulse w-full" />
          <div className="h-4 bg-secondary rounded animate-pulse w-2/3" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="h-24 bg-secondary rounded animate-pulse" />
          <div className="h-10 bg-secondary rounded animate-pulse" />
        </CardContent>
      </Card>
    </main>
  )
}
