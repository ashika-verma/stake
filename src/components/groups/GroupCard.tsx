import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Group } from '@/types/database'

interface GroupCardProps {
  group: Group & { member_count: number; bet_count?: number }
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{group.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant="secondary">{group.member_count} member{group.member_count !== 1 ? 's' : ''}</Badge>
          {group.bet_count !== undefined && (
            <Badge variant="outline">{group.bet_count} bet{group.bet_count !== 1 ? 's' : ''}</Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
