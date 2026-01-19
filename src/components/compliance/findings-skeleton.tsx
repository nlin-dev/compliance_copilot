import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function FindingCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  )
}

export function FindingsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary Card Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary text skeleton - 3 lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          {/* Stats skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Processing time skeleton */}
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>

      {/* Finding Card Skeletons - 5 cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <FindingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
