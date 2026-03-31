import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { QuoteStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const statusStyles: Record<QuoteStatus, string> = {
  draft: "border-amber-300/60 bg-amber-50 text-amber-800",
  ready: "border-emerald-300/60 bg-emerald-50 text-emerald-800",
  sent: "border-sky-300/60 bg-sky-50 text-sky-800",
}

function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {t(`status.${status}`)}
    </Badge>
  )
}

export { QuoteStatusBadge }
